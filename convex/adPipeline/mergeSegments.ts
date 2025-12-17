import { internalMutation } from 'convex/_generated/server';
import type { ClassifiedWindow } from 'convex/adSegments';
import { mergeAdWindows } from 'convex/utils/mergeWindows';
import { v } from 'convex/values';

// iterate windows -> combine to determine ad segments
// next action: save each ad segment to ads table

const MIN_SEGMENT_LENGTH = 5;
const MERGE_GAP = 2;

export const fn = internalMutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    await ctx.db.patch(jobId, {
      status: 'mergingWindows',
    });

    const windows = await ctx.db
      .query('adJobWindows')
      .withIndex('by_jobId_classified', (q) => q.eq('jobId', jobId))
      .collect();

    const segments = mergeAdWindows(
      windows as ClassifiedWindow[],
      MIN_SEGMENT_LENGTH,
      MERGE_GAP
    );

    await ctx.db.patch(jobId, {
      segments,
      status: 'classified',
    });

    // await ctx.scheduler.runAfter(0, internal.adPipeline.saveToAds.fn, {
    //   jobId,
    // });

    return segments;
  },
});
