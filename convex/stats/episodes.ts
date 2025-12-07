import type { Item } from '@convex-dev/aggregate';
import type { Doc, Id } from 'convex/_generated/dataModel';
import {
  internalMutation,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { episodeAggregate } from 'convex/aggregates';

import { v } from 'convex/values';

export const incrementPlayed = internalMutation({
  args: { playbackId: v.id('user_playback') },
  handler: async (ctx, { playbackId }) => {
    const { db } = ctx;
    const playbackDoc = await db.get(playbackId);
    if (!playbackDoc) return;

    const episodeStatsDoc = await db
      .query('episodeStats')
      .withIndex('by_episodeId', (q) =>
        q.eq('episodeId', playbackDoc.episodeId)
      )
      .unique();

    if (episodeStatsDoc) {
      const oldDoc = episodeStatsDoc;
      await db.patch(episodeStatsDoc._id, {
        playCount: episodeStatsDoc.playCount + 1,
      });

      const newDoc = await db.get(episodeStatsDoc._id);

      // Tell the aggregate we replaced an item (old -> new)
      await episodeAggregate.replace(ctx, oldDoc, newDoc!);
    } else {
      const statsId = await db.insert('episodeStats', {
        episodeId: playbackDoc.episodeId,
        podcastId: playbackDoc.podcastId,
        playCount: 1,
        updatedAt: Date.now(),
      });

      const newDoc = await ctx.db.get(statsId);
      // Insert into the aggregate
      await episodeAggregate.insert(ctx, newDoc!);
    }
  },
});

export const mostPlayed = query({
  args: {
    numItems: v.number(),
    offset: v.number(),
    podcastId: v.optional(v.string()),
  },
  handler: async (ctx, { offset, numItems, podcastId }) => {
    const firstInPage = await episodeAggregate.at(ctx, offset); // { namespace: podcastId }
    console.log('first page: ', firstInPage);

    return await getPaginatedEpisodes(ctx, firstInPage, numItems);
  },
});

// export const mostPlayedByPod = query({
//   args: { numItems: v.number(), offset: v.number(), podcastId: v.string() },
//   handler: async (ctx, { offset, numItems, podcastId }) => {
//     const firstInPage = await episodeAggregate.at(ctx, offset, {
//       namespace: podcastId,
//     });

//     return await getPaginatedEpisodes(ctx, firstInPage, numItems);
//   },
// });

async function getPaginatedEpisodes(
  ctx: QueryCtx,
  firstInPage: Item<[number, string], Id<'episodeStats'>>,
  numItems: number
) {
  const { page, cursor, isDone } = await episodeAggregate.paginate(ctx, {
    bounds: {
      lower: {
        key: firstInPage.key,
        id: firstInPage.id,
        inclusive: true,
      },
    },
    pageSize: numItems,
  });

  const episodes = await Promise.all(
    page.map((p) => getEpisodeWithPlayCount(ctx.db, p.key[1], p.key[0]))
  );
  // const episodeStatDocs = await Promise.all(page.map((p) => ctx.db.get(p.id)));
  // const filtered = episodeStatDocs.filter(isNotNullish);

  // const episodes = await Promise.all(
  //   filtered.map((d) =>
  //     getEpisodeWithPlayCount(ctx.db, d.episodeId, d.playCount)
  //   )
  // );

  return {
    page: episodes.filter((ep) => ep._id) as (Doc<'episodes'> & {
      playCount: number;
    })[],
    cursor,
    hasMore: !isDone,
  };
}

export async function getEpisodeWithPlayCount(
  db: QueryCtx['db'],
  episodeId: string,
  playCount: number
) {
  const episode = await db
    .query('episodes')
    .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
    .first();

  return { ...episode, playCount };
}

// export const mostListenedPod = query({
//   args: { numItems: v.number(), offset: v.number() },
//   handler: async (ctx, {offset, numItems}) => {
//     const x = await aggregateByPodcast
//     const firstInPage = await aggregateByPodcast.at(ctx, offset);

//     const page = await aggregateByPodcast.paginate(ctx, {
//       bounds: {
//         lower: {
//           key: firstInPage.key,
//           id: firstInPage.id,
//           inclusive:  true
//         }
//       },
//       pageSize: numItems
//     })

//     const episodes
//   }
// })
