import type { Doc, Id } from 'convex/_generated/dataModel';
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { getTimestamp } from 'convex/playback';
import { getClerkId } from 'convex/utils/auth';
import { v } from 'convex/values';

export const all = query({
  // args: {}
  handler: async ({ db, auth }) => {
    // console.log('CONVEX - GET ALL SUBS CALLED');
    const clerkId = await getClerkId(auth);

    let subscriptions = await db
      .query('subscriptions')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .collect(); // TODO: order ny most recent episode (updated when episodes are fetched )

    return subscriptions;
  },
});

export const allDetails = query({
  handler: async ({ db, auth }) => {
    const clerkId = await getClerkId(auth);

    let subscriptions = await db
      .query('subscriptions')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .collect(); // TODO: order ny most recent episode (updated when episodes are fetched )

    // TODO: catch / handle missing pods
    return Promise.all(
      (subscriptions || []).map((p) => getPod(db, p.podcastId))
    );
  },
});

export const isFollowing = query({
  args: { podId: v.string() },
  handler: async ({ db, auth }, { podId }) => {
    const clerkId = await getClerkId(auth);

    let sub = await db
      .query('subscriptions')
      .withIndex('by_user_podId', (q) =>
        q.eq('clerkId', clerkId).eq('podcastId', podId)
      )
      .unique();

    return !!sub;
  },
});

export const add = internalMutation({
  args: {
    podId: v.string(),
    podConvexId: v.id('podcasts'), // v.optional(v.union(v.id('podcasts'), v.null())),
    itunesId: v.union(v.number(), v.null()),
    autoDownload: v.optional(v.boolean()),
    notificationNew: v.optional(v.boolean()),
  },
  handler: async (
    { auth, db },
    {
      podId,
      podConvexId,
      itunesId,
      autoDownload = false,
      notificationNew = false,
    }
  ) => {
    const clerkId = await getClerkId(auth);

    // TODO: need to make sure podcast exists in podcasts table ??

    // possible to add table constraint (userId & podId unique) ??
    let existingSub = await checkExisting(db, clerkId, podId);

    if (existingSub)
      return { success: true, alreadySubscribed: true, id: existingSub?._id };

    let id = await db.insert('subscriptions', {
      clerkId,
      podcastId: podId,
      podConvexId,
      itunesId,
      subscribedAt: getTimestamp(),
      autoDownload,
      notificationNew,
    });

    return { id, success: true, alreadySubscribed: false };
  },
});

export const remove = mutation({
  args: {
    // subId: v.id('subscriptions'),
    podId: v.string(),
  },
  handler: async ({ auth, db }, { podId }) => {
    const clerkId = await getClerkId(auth);

    let sub = await getSubscription(db, clerkId, podId);
    if (!sub) throw new Error('subscription not found');
    if (sub.clerkId !== clerkId) throw new Error('unauthorized');

    await db.delete(sub._id);
  },
});

export const update = mutation({
  args: {
    // subId: v.id('subscriptions')
    podId: v.string(),
    updates: v.object({
      autoDownload: v.optional(v.boolean()),
      notificationNew: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { podId, updates }) => {
    const clerkId = await getClerkId(ctx.auth);

    let sub = await getSubscription(ctx.db, clerkId, podId);

    await ctx.db.patch(sub._id, { ...updates });
  },
});

export function withoutSystemFields<
  T extends { _creationTime: number; _id: Id<any> }
>(doc: T) {
  const { _id, _creationTime, ...rest } = doc;
  return rest;
}

async function checkExisting(
  db: QueryCtx['db'],
  clerkId: string,
  podId: string
) {
  let sub = await db
    .query('subscriptions')
    .withIndex('by_user_podId', (q) =>
      q.eq('clerkId', clerkId).eq('podcastId', podId)
    )
    .unique();
  return sub;
}

export async function getUserSubscriptions(
  db: QueryCtx['db'],
  clerkId: string
): Promise<Doc<'subscriptions'>[]> {
  return await db
    .query('subscriptions')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .collect();
}

async function getSubscription(
  db: QueryCtx['db'],
  clerkId: string,
  podId: string
): Promise<Doc<'subscriptions'>> {
  let sub = await db
    .query('subscriptions')
    .withIndex('by_user_podId', (q) =>
      q.eq('clerkId', clerkId).eq('podcastId', podId)
    )
    .unique();

  if (!sub) throw new Error('subscription not found');

  return sub;
}

async function getPod(db: QueryCtx['db'], podId: string) {
  let sub = await db
    .query('podcasts')
    .withIndex('by_podId', (q) => q.eq('podcastId', podId))
    .unique();

  if (!sub) throw new Error('subscription not found');

  return sub;
}
// async function ensureBoardExists(
//   ctx: QueryCtx,
//   boardId: string,
// ): Promise<Doc<'boards'>> {
//   const board = await ctx.db
//     .query('boards')
//     .withIndex('id', (q) => q.eq('id', boardId))
//     .unique()

//   invariant(board, `missing board ${boardId}`)
//   return board
// }
