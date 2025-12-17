'use node';

import { vEventId } from '@convex-dev/workflow';
import { internal } from 'convex/_generated/api';
import { internalAction } from 'convex/_generated/server';
import { workflow } from 'convex/adPipeline/workflow';
import { classifyWindowsBatch } from 'convex/utils/llmBatchClassifier';
import { v } from 'convex/values';

// classify windows in batches (continue to call classifyWindows until all adWindows are processed)
// trigger next step: mergeSegments

export const fn = internalAction({
  args: {
    jobId: v.id('adJobs'),
    eventId: vEventId('WindowClassificationComplete'),
  },
  handler: async (ctx, { jobId, eventId }) => {
    const windows = await ctx.runQuery(internal.adJobs.getWindows, {
      jobId,
      classified: false,
      count: 20,
    });

    if (windows.length === 0) {
      // await ctx.scheduler.runAfter(0, internal.adPipeline.mergeSegments.fn, {
      //   jobId,
      // });
      workflow.sendEvent(ctx, { id: eventId });
      return;
    }

    // TODO: check ad table for similar windows labelled as an ad ??
    // requires creating embeddings for windows ?? (expensive/huge storage cost)
    // if high confidence --> label as ad or not ad ??

    // LLM call for the batch
    const classifiedWindows = await classifyWindowsBatch(windows);

    // write results
    await ctx.runMutation(internal.adJobs.patchWindows, {
      windows: classifiedWindows.map((w) => ({ ...w, classified: true })),
    });

    // schedule next batch
    await ctx.scheduler.runAfter(0, internal.adPipeline.classifyWindows.fn, {
      jobId,
      eventId,
    });
  },
});
