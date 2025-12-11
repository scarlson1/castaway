import { api, internal } from 'convex/_generated/api';
import {
  action,
  internalMutation,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { v } from 'convex/values';

export const save = internalMutation({
  args: {
    // podcastId: v.string(),
    episodeId: v.string(),
    // convexEpId: v.id('episodes'),
    audioUrl: v.string(),
    fullText: v.string(),
    segments: v.array(
      v.object({
        id: v.union(v.string(), v.number()),
        start: v.number(),
        end: v.number(),
        text: v.string(),
      })
    ),
  },
  handler: async ({ db }, values) => {
    await db.insert('transcripts', {
      ...values,
      createdAt: Date.now(),
    });
  },
});

export const create = action({
  args: { episodeId: v.string() },
  handler: async (ctx, { episodeId }) => {
    const episode = await ctx.runQuery(api.episodes.getByGuid, {
      id: episodeId,
    }); // getEpisodeById(ctx.db, episodeId);
    if (!episode?.audioUrl) throw new Error('episode not found');

    await ctx.scheduler.runAfter(
      0,
      internal.node.transcribeEpisodeAndSaveTranscript,
      {
        episodeId,
        audioUrl: episode.audioUrl,
      }
    );

    return { success: true, status: 'initiated' };
  },
});

export const getByEpisodeId = query({
  args: { episodeId: v.string() },
  handler: async ({ db }, { episodeId }) => {
    return fetchTranscript(db, episodeId);
  },
});

export async function fetchTranscript(db: QueryCtx['db'], episodeId: string) {
  return await db
    .query('transcripts')
    .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
    .first();
}
