import type { Doc, Id } from 'convex/_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { v } from 'convex/values';

export const getById = query({
  args: { id: v.id('adJobs') },
  handler: async ({ db }, { id }) => {
    return await db.get(id);
  },
});

export const getByEpisodeId = query({
  args: { episodeId: v.string() },
  handler: async ({ db }, { episodeId }) => {
    return getAdJobsByEpisodeId(db, episodeId);
  },
});

export const patch = internalMutation({
  // args: { id: v.id('adJobs'), updates: v. },
  handler: async (
    { db },
    { id, updates }: { id: Id<'adJobs'>; updates: Partial<Doc<'adJobs'>> },
  ) => {
    await db.patch(id, updates);
  },
});

export const getWindows = internalQuery({
  args: {
    jobId: v.id('adJobs'),
    classified: v.boolean(),
    count: v.optional(v.number()),
  },
  handler: async ({ db }, { jobId, classified, count = 10 }) => {
    return await db
      .query('adJobWindows')
      .withIndex('by_jobId_classified', (q) =>
        q.eq('jobId', jobId).eq('classified', classified),
      )
      .take(count);
  },
});

export const patchWindows = internalMutation({
  // args: { windows: v.array(v.)},
  handler: async (
    { db },
    {
      windows,
    }: {
      windows: ({ _id: Id<'adJobWindows'> } & Partial<Doc<'adJobWindows'>>)[];
    },
  ) => {
    for (const { _id, ...window } of windows) {
      await db.patch(_id, {
        ...window,
      });
    }
  },
});

export const getLastClassifiedWindowBefore = internalQuery({
  args: { jobId: v.id('adJobs'), beforeStart: v.number() },
  handler: async (ctx, { jobId, beforeStart }) => {
    // Collect classified windows for this job that start before the current batch
    const windows = await ctx.db
      .query('adJobWindows')
      .withIndex('by_jobId_classified', (q) =>
        q.eq('jobId', jobId).eq('classified', true),
      )
      .collect();

    // Return the one with the highest start time that's still before this batch
    return (
      windows
        .filter((w) => w.start < beforeStart)
        .sort((a, b) => b.start - a.start)[0] ?? null
    );
  },
});

export async function getAdJobsByEpisodeId(
  db: QueryCtx['db'],
  episodeId: string,
) {
  return await db
    .query('adJobs')
    .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
    .collect();
}
