import { internal } from 'convex/_generated/api';
import { internalMutation } from 'convex/_generated/server';
import { buildWindows } from 'convex/utils/buildWindows';
import { v } from 'convex/values';

// should be an action instead b/c of build windows ??
export const fn = internalMutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error('job not found');

    const windows = buildWindows(job.transcript.segments);

    // store windows in DB
    for (const w of windows) {
      await ctx.db.insert('adJobWindows', {
        jobId,
        ...w,
        classified: false,
      });
    }

    // schedule classification batches
    await ctx.scheduler.runAfter(0, internal.adPipeline.classifyWindows.fn, {
      jobId,
    });
  },
});
