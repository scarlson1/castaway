import { asyncMap } from 'convex-helpers';
import { internal } from 'convex/_generated/api';
import { paginationOptsValidator } from 'convex/server';
import { getClerkIdIfExists } from 'convex/utils/auth';
import { isNotNullish } from 'convex/utils/helpers';
import { v } from 'convex/values';
import {
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from './_generated/server';

export const update = mutation({
  args: {
    episodeId: v.string(),
    positionSeconds: v.float64(),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, { episodeId, positionSeconds, completed = false }) => {
    const { auth, db } = ctx;
    // const user = await mustGetCurrentUser(ctx);
    // await ctx.db.patch(user._id, { color });
    const identity = await auth.getUserIdentity();
    const clerkId = identity?.subject;
    if (!clerkId) {
      console.log('user not authenticated');
      return;
    }

    // add convex ID as external ID in clerk and add to session ??
    // const userId: Id<'users'> = identity.subject as Id<'users'>;

    // alternatively create a getUserById function and call db

    let doc = await getUserPlaybackByEpisodeId(db, clerkId, episodeId);

    // create new playback doc if it doesn't exists & add to aggregate table (aggregateByListen)
    if (!doc) {
      console.log(
        `CREATING PLAYBACK DOC ${episodeId} [${identity.subject}]...`
      );

      let ep = await db
        .query('episodes')
        .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
        .unique();

      let values = {
        clerkId,
        episodeId,
        podcastId: ep?.podcastId || '',
        positionSeconds,
        completed: false,
        lastUpdatedAt: getTimestamp(),
        episodeTitle: ep?.title,
        podcastTitle: ep?.podcastTitle,
      };

      if (ep?.durationSeconds && ep.durationSeconds > 0) {
        values['duration'] = ep.durationSeconds;
        values['playedPercentage'] = getPlayedPct(
          positionSeconds,
          ep.durationSeconds
        );
      }

      const id = await db.insert('user_playback', values);

      // TODO: trigger stats runAfter
      // TODO: handle user streaming same episode multiple times ??
      await ctx.scheduler.runAfter(0, internal.stats.episodes.incrementPlayed, {
        playbackId: id,
      });
      await ctx.scheduler.runAfter(0, internal.stats.podcasts.incrementPlayed, {
        playbackId: id,
      });
    } else {
      console.log(`UPDATING PLAYBACK ${episodeId}`);

      let values = {
        positionSeconds,
        completed,
        lastUpdatedAt: getTimestamp(),
      };

      if (doc.duration)
        values['playedPercentage'] = getPlayedPct(
          positionSeconds,
          doc.duration
        );

      await db.patch(doc._id, values);
    }
  },
});

function getPlayedPct(pos: number, duration: number) {
  return Math.round((1 - (duration - pos) / duration) * 100) / 100;
}

// TODO: paginate ??

export const getAllForUser = query({
  handler: async ({ db, auth }) => {
    const identity = await auth.getUserIdentity();
    let clerkId = identity?.subject;
    if (!clerkId) return [];

    return await getAllPlaybackByUser(db, clerkId);
  },
});

export const getAllByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async ({ db }, { clerkId }) => {
    return await getAllPlaybackByUser(db, clerkId);
  },
});

export const getById = query({
  args: { id: v.optional(v.id('user_playback')) },
  handler: async ({ db }, { id }) => {
    // const identity = await auth.getUserIdentity();
    // let clerkId = identity?.subject;
    if (!id) return null;

    return await db.get(id);
  },
});

export const getByEpisodeId = query({
  args: { episodeId: v.string() },
  handler: async ({ db, auth }, { episodeId }) => {
    const clerkId = await getClerkIdIfExists(auth);

    if (!clerkId) return null;

    return await getUserPlaybackByEpisodeId(db, clerkId, episodeId);
  },
});

export const inProgress = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async ({ db, auth }, { paginationOpts }) => {
    const clerkId = await getClerkIdIfExists(auth);
    console.log('CLERK ID: ', clerkId);
    if (!clerkId) throw new Error('must be signed in');
    // return {
    //   page: [],
    //   isDone: true,
    //   continueCursor: null,
    //   splitCursor: null,
    //   pageStatus: null,
    // };

    let { page, ...rest } = await db
      .query('user_playback')
      .withIndex('by_clerkId_lastUpdatedAt', (q) => q.eq('clerkId', clerkId))
      .order('desc')
      .paginate(paginationOpts);

    const merged = await asyncMap(page, async (p) => {
      const episode = await db
        .query('episodes')
        .withIndex('by_episodeId', (q) => q.eq('episodeId', p.episodeId))
        .first();

      if (!episode) return null;
      return { ...episode, ...p };
    });

    return { page: merged.filter(isNotNullish), ...rest };
  },
});

export const lastListened = query({
  handler: async ({ db, auth }) => {
    const clerkId = await getClerkIdIfExists(auth);
    if (!clerkId) return null;

    return await db
      .query('user_playback')
      .withIndex('by_clerkId_lastUpdatedAt', (q) => q.eq('clerkId', clerkId))
      .order('desc')
      .first();
  },
});

async function getUserPlaybackByEpisodeId(
  db: QueryCtx['db'],
  clerkId: string,
  episodeId: string
) {
  return await db
    .query('user_playback')
    .withIndex('by_clerkId_lastUpdatedAt', (q) => q.eq('clerkId', clerkId))
    .filter((q) => q.eq(q.field('episodeId'), episodeId))
    .first();
}

async function getAllPlaybackByUser(
  db: QueryCtx['db'],
  clerkId: string,
  order: 'asc' | 'desc' = 'desc'
) {
  return await db
    .query('user_playback')
    .withIndex('by_clerkId_lastUpdatedAt', (q) => q.eq('clerkId', clerkId))
    .order(order)
    .collect();
}

// bulk episode delete --> clean up playback for all users
export async function getPlaybackByEpisodeId(
  db: QueryCtx['db'],
  episodeId: string
) {
  return await db
    .query('user_playback')
    .filter((q) => q.eq(q.field('episodeId'), episodeId))
    .collect();
}

export function getTimestamp() {
  return new Date().getTime();
}
