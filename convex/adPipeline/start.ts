import type { WorkflowId } from '@convex-dev/workflow';
import { internal } from 'convex/_generated/api';
import { mutation } from 'convex/_generated/server';
import { workflow } from 'convex/adPipeline/workflow';
import { v } from 'convex/values';

// track / start ad detection process

// export const startAdDetection = mutation({
//   args: {
//     episodeId: v.string(),
//     audioUrl: v.string(),
//   },
//   handler: async (ctx, { audioUrl, episodeId }) => {
//     const jobId = await ctx.db.insert('adJobs', {
//       episodeId,
//       audioUrl,
//       status: 'pending',
//       createdAt: Date.now(),
//     });

//     await ctx.scheduler.runAfter(0, internal.adPipeline.transcribe.fn, {
//       jobId,
//     });

//     return { jobId };
//   },
// });

// use workflow instead

export const startAdDetection = mutation({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const workflowId: WorkflowId = await workflow.start(
      ctx,
      internal.adPipeline.workflow.adDetectionWorkflow,
      args,
      {
        onComplete: internal.adPipeline.workflow.handleOnComplete,
        context: args,
      }
    );
    return { workflowId };
  },
});
