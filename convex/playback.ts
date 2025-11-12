import { mutation } from './_generated/server';

import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

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
    console.log('PLAYBACK.UPDATE CALLED', identity?.subject);
    if (identity === null) {
      console.log('user not authenticated');
      return;
      // throw new Error("Not authenticated");
    }

    // add convex ID as external ID in clerk and add to session ??
    const userId: Id<'users'> = identity.subject as Id<'users'>;
    // alternatively create a getUserById function and call db
    if (userId) {
      let doc = await db
        .query('user_playback')
        .withIndex('by_user_episode', (q) =>
          q.eq('userId', userId).eq('episodeId', episodeId)
        )
        .first();
      // let doc = await db.query('user_playback').filter(q => q.eq(q.field('userId'), identity.subject).eq(q.field('episodeId'), episodeId)).first()

      if (!doc) {
        console.log(
          `CREATING PLAYBACK DOC ${episodeId} [${identity.subject}]...`
        );

        await db.insert('user_playback', {
          userId,
          episodeId,
          positionSeconds,
          completed: false,
          lastUpdatedAt: getTimestamp(),
        });
      } else {
        console.log(`UPDATING PLAYBACK ${episodeId}`);

        await db.patch(doc._id, {
          positionSeconds,
          completed,
          lastUpdatedAt: getTimestamp(),
        });
      }
    }

    // await db.patch("user_playback", { userId: user._id, episodeId }, {
    //   positionSeconds,
    //   lastUpdatedAt: Date.now(),
    // });
  },
});

// mutation("updatePlayback", async ({ db, user }, { episodeId, positionSeconds }) => {
//   await db.patch("user_playback", { userId: user._id, episodeId }, {
//     positionSeconds,
//     lastUpdatedAt: Date.now(),
//   });
// });

function getTimestamp() {
  return new Date().getTime();
}
