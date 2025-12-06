import type { Item } from '@convex-dev/aggregate';
import type { Doc, Id } from 'convex/_generated/dataModel';
import {
  internalMutation,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { podcastAggregate } from 'convex/aggregates';
import { v } from 'convex/values';

export const incrementPlayed = internalMutation({
  args: { playbackId: v.id('user_playback') },
  handler: async (ctx, { playbackId }) => {
    const { db } = ctx;
    const playbackDoc = await db.get(playbackId);
    if (!playbackDoc) return;

    const podcastStatsDoc = await db
      .query('podcastStats')
      .withIndex('by_podcastId', (q) =>
        q.eq('podcastId', playbackDoc.podcastId)
      )
      .unique();

    if (podcastStatsDoc) {
      const oldDoc = podcastStatsDoc;
      await db.patch(podcastStatsDoc._id, {
        playCount: podcastStatsDoc.playCount + 1,
      });

      const newDoc = await db.get(podcastStatsDoc._id);

      // Tell the aggregate we replaced an item (old -> new)
      await podcastAggregate.replace(ctx, oldDoc, newDoc!);
    } else {
      const statsId = await db.insert('podcastStats', {
        podcastId: playbackDoc.podcastId,
        playCount: 1,
        updatedAt: Date.now(),
      });

      const newDoc = await ctx.db.get(statsId);
      // Insert into the aggregate
      await podcastAggregate.insert(ctx, newDoc!);
    }
  },
});

// export const topArtist = query({
//   handler: async ({ ctx }) => {
//     // returns the max key / doc (highest playCount)
//     const maxResult = await artistStatsAggregate.max(ctx);
//     // maxResult will be something like { key: [playCount, artistId], id }
//     if (!maxResult) return null;
//     const [playCount, artistId] = maxResult.key;
//     return { artistId, playCount, id: maxResult.id };
//   },
// });

export const mostPlayed = query({
  args: { numItems: v.number(), offset: v.number() },
  handler: async (ctx, { offset, numItems }) => {
    const firstInPage = await podcastAggregate.at(ctx, offset);

    return await getPaginatedPodcasts(ctx, firstInPage, numItems);
  },
});

async function getPaginatedPodcasts(
  ctx: QueryCtx,
  firstInPage: Item<[number, string], Id<'podcastStats'>>,
  numItems: number
) {
  const { page, cursor, isDone } = await podcastAggregate.paginate(ctx, {
    bounds: {
      lower: {
        key: firstInPage.key,
        id: firstInPage.id,
        inclusive: true,
      },
    },
    pageSize: numItems,
  });

  const podcasts = await Promise.all(
    page.map((p) => getPodWithPlayCount(ctx.db, p.key[1], p.key[0]))
  );
  // const episodeStatDocs = await Promise.all(page.map((p) => ctx.db.get(p.id)));
  // const filtered = episodeStatDocs.filter(isNotNullish);

  // const podcasts = await Promise.all(
  //   filtered.map((d) => getPodWithPlayCount(ctx.db, d.podcastId, d.playCount))
  // );

  return {
    page: podcasts.filter((ep) => ep._id) as (Doc<'podcasts'> & {
      playCount: number;
    })[],
    cursor,
    hasMore: !isDone,
  };
}

async function getPodWithPlayCount(
  db: QueryCtx['db'],
  podcastId: string,
  playCount: number
) {
  const episode = await db
    .query('podcasts')
    .withIndex('by_podId', (q) => q.eq('podcastId', podcastId))
    .first();

  return { ...episode, playCount };
}
