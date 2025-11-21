import { internal } from 'convex/_generated/api';
import { mutation } from 'convex/_generated/server';
import { v } from 'convex/values';

// track / start ad detection process

export const startAdDetection = mutation({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
  },
  handler: async (ctx, { audioUrl, episodeId }) => {
    const jobId = await ctx.db.insert('adJobs', {
      episodeId,
      audioUrl,
      status: 'pending',
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.adPipeline.transcribe.fn, {
      jobId,
    });

    return { jobId };
  },
});
