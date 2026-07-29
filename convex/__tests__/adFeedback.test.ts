import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import schema from '../schema';

const modules = import.meta.glob('../**/*.*s');

// ---- factories ----

function episodeData(episodeId = 'ep-1', podcastId = 'pod-1') {
  return {
    episodeId,
    podcastId,
    title: `Episode ${episodeId}`,
    podcastTitle: 'Test Podcast',
    publishedAt: Date.now(),
    audioUrl: `https://example.com/${episodeId}.mp3`,
    image: null,
    durationSeconds: 3600,
    sizeBytes: null,
    feedUrl: null,
    feedImage: null,
    feedItunesId: null,
    summary: 'A great episode',
    enclosureType: 'audio/mpeg',
    explicit: false,
    language: 'en',
    retrievedAt: Date.now(),
  };
}

type TestCtx = ReturnType<typeof convexTest>;

async function seedAd(
  t: TestCtx,
  overrides: Record<string, unknown> = {},
): Promise<Id<'ads'>> {
  return await t.run(async (ctx) => {
    const convexEpId = await ctx.db.insert('episodes', episodeData());
    return await ctx.db.insert('ads', {
      podcastId: 'pod-1',
      episodeId: 'ep-1',
      convexEpId,
      audioUrl: 'https://example.com/ep-1.mp3',
      start: 100,
      end: 160,
      duration: 60,
      transcript: 'brought to you by...',
      confidence: 0.8,
      source: 'llm' as const,
      createdAt: Date.now(),
      ...overrides,
    });
  });
}

const getAd = (t: TestCtx, adId: Id<'ads'>) =>
  t.run(async (ctx) => await ctx.db.get(adId));

const getFeedback = (t: TestCtx, adId: Id<'ads'>) =>
  t.run(
    async (ctx) =>
      await ctx.db
        .query('adFeedback')
        .withIndex('by_adId_clerkId', (q) => q.eq('adId', adId))
        .collect(),
  );

// ---- one vote per user ----

describe('adFeedback vote counting', () => {
  it('counts a single confirm once', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.adFeedback.confirmAd, { adId });

    const ad = await getAd(t, adId);
    expect(ad?.verifyCount).toBe(1);
    expect(ad?.rejectCount).toBe(0);
  });

  it('is idempotent when the same user confirms twice', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);
    const asUser = t.withIdentity({ subject: 'clerk_user_1' });

    await asUser.mutation(api.adFeedback.confirmAd, { adId });
    await asUser.mutation(api.adFeedback.confirmAd, { adId });

    const ad = await getAd(t, adId);
    expect(ad?.verifyCount).toBe(1);
    expect(await getFeedback(t, adId)).toHaveLength(1);
  });

  it('moves the count when a user switches from confirm to reject', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);
    const asUser = t.withIdentity({ subject: 'clerk_user_1' });

    await asUser.mutation(api.adFeedback.confirmAd, { adId });
    await asUser.mutation(api.adFeedback.rejectAd, { adId });

    const ad = await getAd(t, adId);
    expect(ad?.verifyCount).toBe(0);
    expect(ad?.rejectCount).toBe(1);
    // the superseded vote row is replaced, not accumulated
    expect(await getFeedback(t, adId)).toHaveLength(1);
  });

  it('treats the creator of a manual ad as having already confirmed it', async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: 'clerk_user_1' });
    const convexEpId = await t.run(
      async (ctx) => await ctx.db.insert('episodes', episodeData()),
    );

    const adId = await asUser.mutation(api.adFeedback.addManualAdSegment, {
      episodeId: 'ep-1',
      podcastId: 'pod-1',
      convexEpId,
      audioUrl: 'https://example.com/ep-1.mp3',
      start: 100,
      end: 160,
      transcriptText: 'brought to you by...',
    });

    // clicking ✓ on their own ad must not add a second vote
    await asUser.mutation(api.adFeedback.confirmAd, { adId });

    const ad = await getAd(t, adId);
    expect(ad?.verifyCount).toBe(1);
    expect(ad?.verdict).toBeUndefined();

    // and rejecting must move that one vote rather than counting both sides
    await asUser.mutation(api.adFeedback.rejectAd, { adId });
    const rejected = await getAd(t, adId);
    expect(rejected?.verifyCount).toBe(0);
    expect(rejected?.rejectCount).toBe(1);
  });

  it('does not mistake a boundary adjustment for a vote', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);
    const asUser = t.withIdentity({ subject: 'clerk_user_1' });

    await asUser.mutation(api.adFeedback.adjustAdBoundaries, {
      adId,
      start: 105,
      end: 150,
    });
    await asUser.mutation(api.adFeedback.confirmAd, { adId });
    await asUser.mutation(api.adFeedback.rejectAd, { adId });

    const ad = await getAd(t, adId);
    expect(ad?.verifyCount).toBe(0);
    expect(ad?.rejectCount).toBe(1);
  });
});

// ---- verdicts ----

describe('adFeedback verdicts', () => {
  const vote = async (
    t: TestCtx,
    adId: Id<'ads'>,
    subject: string,
    action: 'confirm' | 'reject',
  ) =>
    await t
      .withIdentity({ subject })
      .mutation(
        action === 'confirm'
          ? api.adFeedback.confirmAd
          : api.adFeedback.rejectAd,
        { adId },
      );

  it('withholds a verdict below the vote quorum', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);

    await vote(t, adId, 'user_1', 'confirm');
    await vote(t, adId, 'user_2', 'confirm');

    expect((await getAd(t, adId))?.verdict).toBeUndefined();
  });

  it('records a verdict once quorum and agreement are reached', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);

    await vote(t, adId, 'user_1', 'confirm');
    await vote(t, adId, 'user_2', 'confirm');
    await vote(t, adId, 'user_3', 'confirm');

    expect((await getAd(t, adId))?.verdict).toBe('verified');
  });

  it('clears a verdict when later votes make it contested', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);

    await vote(t, adId, 'user_1', 'confirm');
    await vote(t, adId, 'user_2', 'confirm');
    await vote(t, adId, 'user_3', 'confirm');
    expect((await getAd(t, adId))?.verdict).toBe('verified');

    // 3 confirm / 2 reject is 60% — below the 70% agreement threshold
    await vote(t, adId, 'user_4', 'reject');
    await vote(t, adId, 'user_5', 'reject');

    const ad = await getAd(t, adId);
    expect(ad?.verdict).toBeUndefined();
    expect(ad?.verifyCount).toBe(3);
    expect(ad?.rejectCount).toBe(2);
  });

  it('flips the verdict when the other side reaches agreement', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);

    await vote(t, adId, 'user_1', 'confirm');
    await vote(t, adId, 'user_2', 'confirm');
    await vote(t, adId, 'user_3', 'confirm');
    for (const subject of ['user_1', 'user_2', 'user_3']) {
      await vote(t, adId, subject, 'reject');
    }

    const ad = await getAd(t, adId);
    expect(ad?.verifyCount).toBe(0);
    expect(ad?.rejectCount).toBe(3);
    expect(ad?.verdict).toBe('rejected');
  });
});

// ---- my votes ----

describe('adFeedback.getMyVotesForEpisode', () => {
  it('returns only the calling user\'s votes', async () => {
    const t = convexTest(schema, modules);
    const adId = await seedAd(t);

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.adFeedback.confirmAd, { adId });
    await t
      .withIdentity({ subject: 'clerk_user_2' })
      .mutation(api.adFeedback.rejectAd, { adId });

    const mine = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.adFeedback.getMyVotesForEpisode, { episodeId: 'ep-1' });

    expect(mine).toEqual([{ adId, action: 'confirmed' }]);
  });

  it('returns an empty list when signed out', async () => {
    const t = convexTest(schema, modules);
    await seedAd(t);

    expect(
      await t.query(api.adFeedback.getMyVotesForEpisode, { episodeId: 'ep-1' }),
    ).toEqual([]);
  });
});
