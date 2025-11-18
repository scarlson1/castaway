import { api, internal } from 'convex/_generated/api';
import { action, internalMutation, query } from 'convex/_generated/server';
import type { SegmentLabel } from 'convex/utils/llmClassifier';
import { v } from 'convex/values';

// initial implementation
// export const insert = internalMutation({
//   args: {
//     audioUrl: v.string(),
//     ads: v.array(
//       v.object({
//         start: v.number(),
//         end: v.number(),
//       })
//     ),
//     episodeId: v.string(),
//     convexEpId: v.id('episodes'),
//     podcastId: v.string(),
//   },
//   handler: async (
//     { db },
//     { audioUrl, ads, episodeId, convexEpId, podcastId }
//   ) => {
//     return await db.insert('adSegments', {
//       audioUrl,
//       ads,
//       episodeId,
//       convexEpId,
//       podcastId,
//       createdAt: Date.now(),
//     });
//   },
// });

interface WindowTime {
  start: number;
  end: number;
}

export interface Window extends WindowTime {
  text: string;
}

export interface LabelledWindow extends Window {
  label: SegmentLabel;
}

export interface ClassifiedWindow extends Window {
  is_ad: boolean;
  confidence: number;
  reason: string;
}

export interface MergedAdSegment {
  start: number;
  end: number;
  duration: number;
  transcript: string;
  confidence: number;
}

export const transcribeAndClassify = action({
  args: {
    // audioUrl: v.string(),
    episodeId: v.string(),
    // convexEpId: v.id('episodes'),
    // podcastId: v.string(),
  },
  // handler: async (ctx, { episodeId }): Promise<{ ads: MergedAdSegment[] }> => {
  handler: async (ctx, { episodeId }): Promise<{ status: string }> => {
    const episode = await ctx.runQuery(api.episodes.getByGuid, {
      id: episodeId,
    });
    if (!episode) throw new Error(`Episode not found (ID: ${episodeId})`);

    console.log(
      `starting podcast ad detection for episode ${episodeId}: "${episode.title}"`
    );
    await ctx.scheduler.runAfter(0, internal.node.processPodcastAds, {
      audioUrl: episode.audioUrl,
      episodeId: episode.episodeId,
      podcastId: episode.podcastId,
      convexEpId: episode._id,
    });

    // const ads = await processPodcast(ctx, {
    //   audioUrl: episode.audioUrl,
    //   episodeId: episode.episodeId,
    //   podcastId: episode.podcastId,
    //   convexEpId: episode._id,
    // });

    // return { ads };
    return { status: 'initiated' };
  },
});

// new implementation
export const saveAdDoc = internalMutation({
  args: {
    // sourceId: v.string(),
    podcastId: v.string(),
    episodeId: v.string(),
    convexEpId: v.id('episodes'),
    audioUrl: v.string(),
    start: v.number(),
    end: v.number(),
    duration: v.number(),
    transcript: v.string(),
    confidence: v.number(),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('ads', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const searchAds = query({
  args: {
    embedding: v.array(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('ads') // @ts-ignore TODO: fix type error
      .vectorSearch('by_embedding', args.embedding, {
        limit: args.limit ?? 5,
      })
      .collect();
  },
});

export const getByEpisodeId = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    return db
      .query('ads')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', id))
      .collect();
  },
});

export const getByConvexId = query({
  args: { convexId: v.id('ads') },
  handler: async ({ db }, { convexId }) => {
    return db.get(convexId);
  },
});
