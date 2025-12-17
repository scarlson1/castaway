import { type WorkflowId } from '@convex-dev/workflow';
import { internal } from 'convex/_generated/api';
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { workflow } from 'convex/transcriptWorkflow';
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
    summaryTitle: v.optional(v.string()),
    oneSentenceSummary: v.optional(v.string()),
    detailedSummary: v.optional(v.string()),
    keyTopics: v.optional(v.array(v.string())),
    notableQuotes: v.optional(v.array(v.string())),
  },
  handler: async ({ db }, values) => {
    return await db.insert('transcripts', {
      ...values,
      createdAt: Date.now(),
    });
  },
});

export const update = internalMutation({
  args: {
    transcriptId: v.id('transcripts'),
    episodeId: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    fullText: v.optional(v.string()),
    segments: v.optional(
      v.array(
        v.object({
          id: v.union(v.string(), v.number()),
          start: v.number(),
          end: v.number(),
          text: v.string(),
        })
      )
    ),
    summaryTitle: v.optional(v.string()),
    oneSentenceSummary: v.optional(v.string()),
    detailedSummary: v.optional(v.string()),
    keyTopics: v.optional(v.array(v.string())),
    notableQuotes: v.optional(v.array(v.string())),
  },
  handler: async ({ db }, { transcriptId, ...updates }) => {
    await db.patch(transcriptId, { ...updates });
    // return await db.insert('transcripts', {
    //   ...values,
    //   createdAt: Date.now(),
    // });
  },
});

// manually trigger transcription of episode (in case it wasn't transcribed on import)
// export const create = action({
//   args: { episodeId: v.string() },
//   handler: async (ctx, { episodeId }) => {
//     const episode = await ctx.runQuery(api.episodes.getByGuid, {
//       id: episodeId,
//     }); // getEpisodeById(ctx.db, episodeId);
//     if (!episode?.audioUrl) throw new Error('episode not found');

//     await ctx.scheduler.runAfter(
//       0,
//       internal.node.transcribeEpisodeAndSaveTranscript,
//       {
//         episodeId,
//         audioUrl: episode.audioUrl,
//         episodeTitle: episode.title,
//       }
//     );

//     return { success: true, status: 'initiated' };
//   },
// });

export const getByConvexId = query({
  args: { id: v.id('transcripts') },
  handler: async ({ db }, { id }) => {
    return await db.get(id);
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
    .order('desc')
    .first();
}

export const create = mutation({
  args: {
    episodeId: v.string(),
    forceTranscribe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflowId: WorkflowId = await workflow.start(
      ctx,
      internal.transcriptWorkflow.transcribeWorkflow,
      args,
      {
        onComplete: internal.transcriptWorkflow.handleOnComplete,
        context: args,
      }
    );
    return { workflowId };
  },
});
