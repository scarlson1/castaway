import { internalMutation } from 'convex/_generated/server';
import type { ClassifiedWindow } from 'convex/adSegments';
import { mergeAdWindows } from 'convex/utils/mergeWindows';
import { v } from 'convex/values';

export const fn = internalMutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const windows = await ctx.db
      .query('adJobWindows')
      .withIndex('by_jobId', (q) => q.eq('jobId', jobId))
      .collect();

    // const segments = mergeAdjacentAds(windows);
    const segments = mergeAdWindows(windows as ClassifiedWindow[]);

    await ctx.db.patch(jobId, {
      segments,
      status: 'complete',
    });
  },
});
