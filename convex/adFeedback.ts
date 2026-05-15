import { internal } from 'convex/_generated/api';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from 'convex/_generated/server';
import { getClerkId, getClerkIdIfExists } from 'convex/utils/auth';
import { v } from 'convex/values';

const MIN_VOTES = 3;
const AGREE_THRESHOLD = 0.7;

function computeVerdict(
  verifyCount: number,
  rejectCount: number,
): 'verified' | 'rejected' | null {
  const total = verifyCount + rejectCount;
  if (total < MIN_VOTES) return null;
  if (verifyCount / total >= AGREE_THRESHOLD) return 'verified';
  if (rejectCount / total >= AGREE_THRESHOLD) return 'rejected';
  return null; // enough votes but contested (no clear majority)
}

async function recalibrateThreshold(ctx: MutationCtx, podcastId: string) {
  // Scale note: collecting all verified/rejected ads for a podcast to recalibrate
  // is fine at personal-app scale. At high volume, track running counts in
  // podcastAdConfig directly and update them incrementally instead of re-scanning.
  const confirmedAds = await ctx.db
    .query('ads')
    .withIndex('by_podcastId_verdict', (q) =>
      q.eq('podcastId', podcastId).eq('verdict', 'verified'),
    )
    .collect();

  const rejectedAds = await ctx.db
    .query('ads')
    .withIndex('by_podcastId_verdict', (q) =>
      q.eq('podcastId', podcastId).eq('verdict', 'rejected'),
    )
    .collect();

  const sampleSize = confirmedAds.length + rejectedAds.length;
  if (sampleSize < 5) return;

  const truePositiveConfs = confirmedAds.map((a) => a.confidence);
  const falsePositiveConfs = rejectedAds.map((a) => a.confidence);

  const candidates = [
    0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85,
  ];
  let best = 0.4;
  let bestErrors = Infinity;

  for (const t of candidates) {
    const fp = falsePositiveConfs.filter((c) => c >= t).length;
    const fn = truePositiveConfs.filter((c) => c < t).length;
    if (fp + fn < bestErrors) {
      bestErrors = fp + fn;
      best = t;
    }
  }

  const existing = await ctx.db
    .query('podcastAdConfig')
    .withIndex('by_podcastId', (q) => q.eq('podcastId', podcastId))
    .unique();

  const record = {
    podcastId,
    confidenceThreshold: best,
    feedbackSampleSize: sampleSize,
    lastCalibratedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, record);
  } else {
    await ctx.db.insert('podcastAdConfig', record);
  }
}

export const confirmAd = mutation({
  args: { adId: v.id('ads') },
  handler: async (ctx, { adId }) => {
    const clerkId = await getClerkId(ctx.auth);

    const ad = await ctx.db.get(adId);
    if (!ad) throw new Error('ad not found');

    const existingVote = await ctx.db
      .query('adFeedback')
      .withIndex('by_adId_clerkId', (q) =>
        q.eq('adId', adId).eq('clerkId', clerkId),
      )
      .first();

    if (existingVote?.action === 'confirmed') return;

    let verifyCount = ad.verifyCount ?? 0;
    let rejectCount = ad.rejectCount ?? 0;

    if (existingVote?.action === 'rejected') {
      rejectCount = Math.max(0, rejectCount - 1);
      await ctx.db.delete(existingVote._id);
    }

    verifyCount += 1;
    const verdict = computeVerdict(verifyCount, rejectCount);
    const verdictChanged = verdict !== null && verdict !== ad.verdict;

    await ctx.db.patch(adId, {
      verifyCount,
      rejectCount,
      ...(verdict !== null ? { verdict } : {}),
    });

    await ctx.db.insert('adFeedback', {
      adId,
      clerkId,
      episodeId: ad.episodeId,
      podcastId: ad.podcastId,
      action: 'confirmed',
      originalStart: ad.start,
      originalEnd: ad.end,
      transcriptText: ad.transcript,
      llmConfidence: ad.confidence,
      createdAt: Date.now(),
    });

    if (verdictChanged) {
      await recalibrateThreshold(ctx, ad.podcastId);
    }
  },
});

export const rejectAd = mutation({
  args: {
    adId: v.id('ads'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { adId, reason }) => {
    const clerkId = await getClerkId(ctx.auth);

    const ad = await ctx.db.get(adId);
    if (!ad) throw new Error('ad not found');

    const existingVote = await ctx.db
      .query('adFeedback')
      .withIndex('by_adId_clerkId', (q) =>
        q.eq('adId', adId).eq('clerkId', clerkId),
      )
      .first();

    if (existingVote?.action === 'rejected') return;

    let verifyCount = ad.verifyCount ?? 0;
    let rejectCount = ad.rejectCount ?? 0;

    if (existingVote?.action === 'confirmed') {
      verifyCount = Math.max(0, verifyCount - 1);
      await ctx.db.delete(existingVote._id);
    }

    rejectCount += 1;
    const verdict = computeVerdict(verifyCount, rejectCount);
    const verdictChanged = verdict !== null && verdict !== ad.verdict;

    await ctx.db.patch(adId, {
      verifyCount,
      rejectCount,
      ...(verdict !== null ? { verdict } : {}),
    });

    await ctx.db.insert('adFeedback', {
      adId,
      clerkId,
      episodeId: ad.episodeId,
      podcastId: ad.podcastId,
      action: 'rejected',
      originalStart: ad.start,
      originalEnd: ad.end,
      transcriptText: ad.transcript,
      llmConfidence: ad.confidence,
      rejectionReason: reason,
      createdAt: Date.now(),
    });

    if (verdictChanged) {
      await recalibrateThreshold(ctx, ad.podcastId);
    }
  },
});

export const addManualAdSegment = mutation({
  args: {
    episodeId: v.string(),
    podcastId: v.string(),
    convexEpId: v.id('episodes'),
    audioUrl: v.string(),
    start: v.number(),
    end: v.number(),
    transcriptText: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx.auth);

    const adId = await ctx.db.insert('ads', {
      episodeId: args.episodeId,
      podcastId: args.podcastId,
      convexEpId: args.convexEpId,
      audioUrl: args.audioUrl,
      start: args.start,
      end: args.end,
      duration: args.end - args.start,
      transcript: args.transcriptText,
      confidence: 1.0,
      source: 'user',
      verifyCount: 1, // creator's implicit confirm vote
      rejectCount: 0,
      createdAt: Date.now(),
    });

    await ctx.db.insert('adFeedback', {
      adId,
      clerkId,
      episodeId: args.episodeId,
      podcastId: args.podcastId,
      action: 'manually_added',
      originalStart: args.start,
      originalEnd: args.end,
      transcriptText: args.transcriptText,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.node.fillAdEmbedding, {
      adId,
      transcript: args.transcriptText,
    });

    return adId;
  },
});

// Returns the current user's vote for each ad in an episode.
// Used by the UI to highlight which ads the user has already voted on.
export const getMyVotesForEpisode = query({
  args: { episodeId: v.string() },
  handler: async (ctx, { episodeId }) => {
    const clerkId = await getClerkIdIfExists(ctx.auth);
    if (!clerkId) return [];

    const feedback = await ctx.db
      .query('adFeedback')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
      .collect();

    return feedback
      .filter((f) => f.clerkId === clerkId)
      .map((f) => ({ adId: f.adId, action: f.action }));
  },
});

// Used by classifyWindows to inject podcast-specific examples into the LLM prompt.
export const getFewShotExamples = internalQuery({
  args: { podcastId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { podcastId, limit = 8 }) => {
    const confirmed = await ctx.db
      .query('adFeedback')
      .withIndex('by_podcastId_action', (q) =>
        q.eq('podcastId', podcastId).eq('action', 'confirmed'),
      )
      .order('desc')
      .take(Math.ceil(limit * 0.6));

    const rejected = await ctx.db
      .query('adFeedback')
      .withIndex('by_podcastId_action', (q) =>
        q.eq('podcastId', podcastId).eq('action', 'rejected'),
      )
      .order('desc')
      .take(Math.floor(limit * 0.4));

    return [
      ...confirmed.map((f) => ({ text: f.transcriptText, is_ad: true })),
      ...rejected.map((f) => ({ text: f.transcriptText, is_ad: false })),
    ];
  },
});

export const patchAdEmbedding = internalMutation({
  args: { adId: v.id('ads'), embedding: v.array(v.number()) },
  handler: async (ctx, { adId, embedding }) => {
    await ctx.db.patch(adId, { embedding });
  },
});
