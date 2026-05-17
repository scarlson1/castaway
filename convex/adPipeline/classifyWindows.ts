'use node';

import { vEventId } from '@convex-dev/workflow';
import { api, internal } from 'convex/_generated/api';
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
    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: {
        status: 'classifyingWindows',
      },
    });

    const windows = await ctx.runQuery(internal.adJobs.getWindows, {
      jobId,
      classified: false,
      count: 20,
    });

    if (windows.length === 0) {
      await workflow.sendEvent(ctx, { id: eventId });
      return;
    }

    // Fetch podcast-specific few-shot examples from user feedback history
    const job = await ctx.runQuery(api.adJobs.getById, { id: jobId });
    const episode = job
      ? await ctx.runQuery(api.episodes.getByGuid, { id: job.episodeId })
      : null;
    const fewShotExamples = episode
      ? await ctx.runQuery(internal.adFeedback.getFewShotExamples, {
          podcastId: episode.podcastId,
        })
      : [];

    // Fetch the last classified window from a previous batch so the first
    // window in this batch gets context across the batch boundary.
    const firstWindowStart = windows[0].start;
    const lastClassified = await ctx.runQuery(
      internal.adJobs.getLastClassifiedWindowBefore,
      { jobId, beforeStart: firstWindowStart },
    );

    // LLM call for the batch
    const classifiedWindows = await classifyWindowsBatch(
      windows,
      fewShotExamples,
      lastClassified?.text ?? null,
    );

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
