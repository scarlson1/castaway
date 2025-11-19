import { api, internal } from 'convex/_generated/api';
import { internalAction } from 'convex/_generated/server';
import { transcribeUrl } from 'convex/utils/transcribeUrl';
import { v } from 'convex/values';

export const fn = internalAction({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    // const jobRow = await ctx.db.get(jobId);
    const job = await ctx.runQuery(api.adJobs.getById, { id: jobId });
    if (!job?.audioStorageId) throw new Error('job missing audioStorageId');

    // const audio = await ctx.storage.get(job.audioStorageId);
    // if (!audio) throw new Error('Audio missing');
    const audioStorageUrl = await ctx.storage.getUrl(job.audioStorageId);
    if (!audioStorageUrl) throw new Error('Audio missing from storage');

    // TODO: need to batch --> call helper fn

    // const transcript = await transcribeUrl(job.audioUrl)
    const transcript = await transcribeUrl(audioStorageUrl, {});

    // const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    //   },
    //   body: (() => {
    //     const fd = new FormData();
    //     fd.append('model', 'gpt-4o-audio-transcribe');
    //     fd.append(
    //       'file',
    //       new Blob([audio], { type: 'audio/mpeg' }),
    //       'audio.mp3'
    //     );
    //     fd.append('response_format', 'verbose_json');
    //     return fd;
    //   })(),
    // });

    // const transcript = await resp.json();

    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: {
        transcript,
        status: 'transcribed',
      },
    });
    // await ctx.db.patch(jobId, {
    //   transcript,
    //   status: "transcribed",
    // });

    await ctx.scheduler.runAfter(0, internal.adPipeline.chunkTranscript.fn, {
      jobId,
    });
  },
});
