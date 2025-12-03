import { internalMutation, query } from 'convex/_generated/server';
import { v } from 'convex/values';

interface WindowTime {
  start: number;
  end: number;
}

export interface Window extends WindowTime {
  text: string;
}

// export interface LabelledWindow extends Window {
//   label: SegmentLabel;
// }

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
    // embedding: v.array(v.number()),
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit, searchQuery }) => {
    // chatgpt ?? use node.searchAds instead
    // return await ctx.db
    //   .query('ads')
    //   .vectorSearch('by_embedding', args.embedding, {
    //     limit: args.limit ?? 5,
    //   })
    //   .collect();
  },
});

export const getByEpisodeId = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    let ads = await db
      .query('ads')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', id))
      .collect();

    return ads.map(({ embedding, ...a }) => ({ ...a }));
  },
});

export const getByConvexId = query({
  args: { convexId: v.id('ads') },
  handler: async ({ db }, { convexId }) => {
    return db.get(convexId);
  },
});
