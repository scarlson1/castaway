import { internalMutation } from 'convex/_generated/server';
import { fetchTranscript } from 'convex/transcripts';
import { buildWindows } from 'convex/utils/buildWindows';
import { v } from 'convex/values';

// takes transcript segments --> combine/break into fixed size windows
// save windows to adJobWindows table
// trigger classification job to classify windows

const WINDOW_SIZE = 12; // seconds
const WINDOW_OVERLAP = Math.ceil(WINDOW_SIZE / 3);

// should be an action instead b/c of build windows ??
export const fn = internalMutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error('job not found');

    const transcript = await fetchTranscript(ctx.db, job.episodeId);
    if (!transcript)
      throw new Error(
        `transcript not found [episode: ${job.episodeId}] [adJob: ${jobId}]`
      );

    const windows = buildWindows(
      transcript.segments || [],
      WINDOW_SIZE,
      WINDOW_OVERLAP
    );

    // store windows in DB
    for (const w of windows) {
      await ctx.db.insert('adJobWindows', {
        jobId,
        ...w,
        classified: false,
      });
    }

    // schedule classification batches
    // await ctx.scheduler.runAfter(0, internal.adPipeline.classifyWindows.fn, {
    //   jobId,
    // });
  },
});
