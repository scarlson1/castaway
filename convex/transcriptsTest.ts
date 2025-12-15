import { internalMutation } from 'convex/_generated/server';
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
    await db.insert('transcripts', {
      ...values,
      createdAt: Date.now(),
    });
  },
});
