import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const update = mutation({
  args: {
    episodeId: v.string(),
    positionSeconds: v.float64(),
    completed: v.optional(v.boolean()),
  },
  handler: async (
    { auth, db },
    { episodeId, positionSeconds, completed = false }
  ) => {
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

    let doc = await db
      .query('user_playback')
      .withIndex('by_clerk_episode', (q) =>
        q.eq('clerkId', clerkId).eq('episodeId', episodeId)
      )
      .first();

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

      await db.insert('user_playback', values);
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

export const getAllForUser = query({
  handler: async ({ db, auth }) => {
    const identity = await auth.getUserIdentity();
    let clerkId = identity?.subject;
    if (!clerkId) return [];

    let playback = await db
      .query('user_playback')
      .withIndex('by_clerk_id')
      .collect();
    return playback;
  },
});

export const getById = query({
  args: { id: v.optional(v.id('user_playback')) },
  handler: async ({ db }, { id }) => {
    // const identity = await auth.getUserIdentity();
    // let clerkId = identity?.subject;
    if (!id) {
      return null;
    }
    return await db.get(id);
  },
});

// mutation("updatePlayback", async ({ db, user }, { episodeId, positionSeconds }) => {
//   await db.patch("user_playback", { userId: user._id, episodeId }, {
//     positionSeconds,
//     lastUpdatedAt: Date.now(),
//   });
// });

export function getTimestamp() {
  return new Date().getTime();
}
