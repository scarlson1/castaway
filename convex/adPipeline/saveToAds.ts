import { api, internal } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { internalAction } from 'convex/_generated/server';
import { v } from 'convex/values';

// save each ad segment from job to ads table

export const fn = internalAction({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    // const adJob = await db.get(adJobId);
    const adJob = await ctx.runQuery(api.adJobs.getById, { id: jobId });
    if (!adJob) throw new Error('not found');
    if (!adJob.segments?.length) {
      console.log(`no ads. returning early`);
      return;
    }

    const episode = await ctx.runQuery(api.episodes.getByGuid, {
      id: adJob.episodeId,
    });
    if (!episode) throw new Error('episode not found');

    const adSegmentIds: Id<'ads'>[] = [];

    for (let segment of adJob.segments) {
      let adSegmentId = await ctx.runAction(internal.node.saveAdSegment, {
        episodeId: adJob.episodeId,
        podcastId: episode.podcastId,
        audioUrl: adJob.audioUrl,
        // duration: segment.duration,
        convexEpId: episode._id,
        start: segment.start,
        end: segment.end,
        // createdAt: Date.now(),
        transcript: segment.transcript,
        confidence: segment.confidence,
      });
      if (adSegmentId) adSegmentIds.push(adSegmentId);
    }

    await ctx.runMutation(internal.adJobs.patch, {
      id: jobId,
      updates: { status: 'complete', completedAt: Date.now() },
    });

    return adSegmentIds;
  },
});
