import { internalMutation } from 'convex/_generated/server';
import type { ClassifiedWindow } from 'convex/adSegments';
import { mergeAdWindows } from 'convex/utils/mergeWindows';
import { v } from 'convex/values';

// iterate windows -> combine to determine ad segments
// next action: save each ad segment to ads table

const MIN_SEGMENT_LENGTH = 5;
const MERGE_GAP = 2;
const DEFAULT_THRESHOLD = 0.4;

export const fn = internalMutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error('job not found');

    await ctx.db.patch(jobId, {
      status: 'mergingWindows',
    });

    // Look up per-podcast confidence threshold calibrated from user feedback
    const episode = await ctx.db
      .query('episodes')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', job.episodeId))
      .first();

    const config = episode
      ? await ctx.db
          .query('podcastAdConfig')
          .withIndex('by_podcastId', (q) => q.eq('podcastId', episode.podcastId))
          .unique()
      : null;

    const threshold = config?.confidenceThreshold ?? DEFAULT_THRESHOLD;

    const windows = await ctx.db
      .query('adJobWindows')
      .withIndex('by_jobId_classified', (q) => q.eq('jobId', jobId))
      .collect();

    const segments = mergeAdWindows(
      windows as ClassifiedWindow[],
      MIN_SEGMENT_LENGTH,
      MERGE_GAP,
      threshold,
    );

    await ctx.db.patch(jobId, {
      segments,
      status: 'classified',
    });

    return segments;
  },
});
