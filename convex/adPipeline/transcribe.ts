import { api, internal } from 'convex/_generated/api';
import { internalAction } from 'convex/_generated/server';
import { v } from 'convex/values';

// fetch audio from url --> break into chunks (open AI 25MB limit)
// call transcription service for each chunk
// write transcript to adJob doc
// trigger next step: chunkTranscript

export const fn = internalAction({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.runQuery(api.adJobs.getById, { id: jobId });
    if (!job?.audioUrl) throw new Error('job missing audioUrl');
    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: {
        status: 'transcribing',
      },
    });

    let transcript;
    let transcriptId;

    // use transcript from DB if existing
    const existingTranscript = await ctx.runQuery(
      api.transcripts.getByEpisodeId,
      { episodeId: job.episodeId }
    );

    if (existingTranscript) {
      transcript = {
        text: existingTranscript.fullText,
        segments: existingTranscript.segments,
      };
      transcriptId = existingTranscript._id;
    } else {
      const result = await ctx.runAction(
        internal.node.transcribeEpisodeAndSaveTranscript,
        {
          episodeId: job.episodeId,
          audioUrl: job.audioUrl,
        }
      );
      transcript = result.transcript;
      transcriptId = result.transcriptId;
    }

    if (!transcriptId) throw new Error('failed to save transcript to DB');

    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: {
        transcriptId,
        status: 'transcribed',
      },
    });

    await ctx.scheduler.runAfter(0, internal.adPipeline.chunkTranscript.fn, {
      jobId,
    });
  },
});
