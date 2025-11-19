import type { Doc, Id } from 'convex/_generated/dataModel';
import {
  internalMutation,
  internalQuery,
  query,
} from 'convex/_generated/server';
import { v } from 'convex/values';

export const getById = query({
  args: { id: v.id('adJobs') },
  handler: async ({ db }, { id }) => {
    return await db.get(id);
  },
});

export const patch = internalMutation({
  // args: { id: v.id('adJobs'), updates: v. },
  handler: async (
    { db },
    { id, updates }: { id: Id<'adJobs'>; updates: Partial<Doc<'adJobs'>> }
  ) => {
    await db.patch(id, updates);
  },
});

export const getWindows = internalQuery({
  args: { jobId: v.id('adJobs') },
  handler: async ({ db }, { jobId }) => {
    return await db
      .query('adJobWindows')
      .withIndex('by_jobId_classified', (q) =>
        q.eq('jobId', jobId).eq('classified', false)
      )
      .take(5);
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
    }
  ) => {
    for (const { _id, ...window } of windows) {
      await db.patch(_id, {
        ...window,
      });
    }
  },
});
