'use node';

import { api, internal } from 'convex/_generated/api';
import { internalAction } from 'convex/_generated/server';
import { transcribeUrl } from 'convex/utils/transcribeUrl';
import { v } from 'convex/values';

export const fn = internalAction({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    // const jobRow = await ctx.db.get(jobId);
    const job = await ctx.runQuery(api.adJobs.getById, { id: jobId });
    // if (!job?.audioStorageId) throw new Error('job missing audioStorageId');
    if (!job?.audioUrl) throw new Error('job missing audioUrl');
    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: {
        status: 'transcribing',
      },
    });

    // const audio = await ctx.storage.get(job.audioStorageId);
    // if (!audio) throw new Error('Audio missing');
    // const audioStorageUrl = await ctx.storage.getUrl(job.audioStorageId);
    // if (!audioStorageUrl) throw new Error('Audio missing from storage');

    // TODO: need to batch --> call helper fn
    // BUG:  hits memory limits ??
    const transcript = await transcribeUrl(job.audioUrl, {});

    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: {
        transcript,
        status: 'transcribed',
      },
    });

    await ctx.scheduler.runAfter(0, internal.adPipeline.chunkTranscript.fn, {
      jobId,
    });
  },
});
