import {
  internalMutation,
  internalQuery,
  type QueryCtx,
} from 'convex/_generated/server';
import { getTimestamp } from 'convex/playback';
import { WithoutSystemFields } from 'convex/server';
import { v } from 'convex/values';
import { Doc } from '../convex/_generated/dataModel';

export const add = internalMutation({
  // {
  //   podcastId: v.string(),
  //   feedUrl: v.string(),
  //   title: v.string(),
  //   description: v.string(),
  //   imageUrl: v.union(v.string(), v.null()),
  //   itunesId: v.union(v.number(), v.null()),
  // },
  handler: async (
    { db },
    { podcastId, ...rest }: WithoutSystemFields<Doc<'podcasts'>>
  ) => {
    // possible to add table constraint (userId & podcastId unique)
    let existingSub = await checkExisting(db, podcastId);

    if (existingSub) return { success: true, new: false };

    const id = await db.insert('podcasts', {
      podcastId,
      ...rest,
      lastFetchedAt: getTimestamp(),
    });

    return { success: true, new: true, id };
  },
});

export const exists = internalQuery({
  args: { podcastId: v.string() },
  handler: async ({ db }, { podcastId }) => {
    // return Boolean(await checkExisting(db, podcastId));
    let pod = await checkExisting(db, podcastId);
    let exists = Boolean(pod);
    return { exists, convexId: pod?._id || null };
  },
});

export const getPod = internalQuery({
  args: { podcastId: v.id('podcasts') },
  handler: async ({ db }, { podcastId }) => {
    return db.get(podcastId);
  },
});

async function checkExisting(db: QueryCtx['db'], podId: string) {
  return await db
    .query('podcasts')
    .withIndex('by_podId', (q) => q.eq('podcastId', podId))
    .unique();
}
