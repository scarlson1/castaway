import { asyncMap } from 'convex-helpers';
import { internal } from 'convex/_generated/api';
import { Doc, type Id } from 'convex/_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { api } from 'convex/actions';
import { getTimestamp } from 'convex/playback';
import {
  paginationOptsValidator,
  type WithoutSystemFields,
} from 'convex/server';
import { getUserSubscriptions } from 'convex/subscribe';
import { getClerkId, getClerkIdIfExists } from 'convex/utils/auth';
import { createEmbedding } from 'convex/utils/embeddings';
import { isNotNullish } from 'convex/utils/helpers';
import { v } from 'convex/values';
import type {
  EpisodeItem,
  EpisodesByPodGuidResult,
} from '~/lib/podcastIndexTypes';

export const getByPodcast = query({
  args: { podId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async ({ db }, { podId, paginationOpts }) => {
    const results = await db
      .query('episodes')
      .withIndex('by_podId_pub', (q) => q.eq('podcastId', podId))
      .order('desc')
      .paginate(paginationOpts);

    return results;
  },
});

// TODO: support infinite scroll
export const feed = query({
  args: { numItems: v.optional(v.number()) },
  handler: async ({ db, auth }, { numItems = 50 }) => {
    const clerkId = await getClerkIdIfExists(auth);
    if (clerkId) {
      // move user feed to helper function
      const subscriptions = await getUserSubscriptions(db, clerkId);

      const podcastIds = subscriptions.map((s) => s.podcastId);

      if (podcastIds.length === 0) return [];

      const episodesPromises = podcastIds.map((podcastId) =>
        getRecentEpisodes(db, podcastId, 5)
      );

      const episodesArrays = await Promise.all(episodesPromises);

      // Flatten + sort by publishedAt
      const allEpisodes = episodesArrays.flat();

      return allEpisodes
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, numItems);
    }

    return db
      .query('episodes')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(numItems);
  },
});

export const getRecentFeed = query({
  args: {
    pageSize: v.optional(v.number()),
    cursor: v.optional(
      v.union(
        v.object({
          publishedAt: v.optional(v.number()),
          episodeId: v.optional(v.id('episodes')),
        }),
        v.null()
      )
    ),
  },
  handler: async ({ db, auth }, { pageSize = 10, cursor }) => {
    // Fetch subscriptions
    const clerkId = await getClerkId(auth);
    const subscriptions = await getUserSubscriptions(db, clerkId);

    const podcastIds = subscriptions.map((s) => s.podcastId);
    if (podcastIds.length === 0) return { items: [], cursor: null };

    // Fetch episodes for each podcast
    const perPodcast = await Promise.all(
      podcastIds.map((podcastId) => {
        let q = db
          .query('episodes')
          .withIndex('by_podId_pub', (x) => x.eq('podcastId', podcastId))
          .order('desc');

        // If cursor exists, apply "start after" filter
        if (cursor?.publishedAt) {
          q = q.filter((x) =>
            x.lt(x.field('publishedAt'), cursor.publishedAt as number)
          );
          // q = q.filter(ep =>
          //   ep.publishedAt < cursor.publishedAt ||
          //   (ep.publishedAt === cursor.publishedAt &&
          //     ep._id < cursor.episodeId)
          // );
        }

        return q.take(Math.ceil(pageSize / subscriptions.length) * 2); // small per-podcast request
      })
    );

    // Merge + sort from all podcasts
    const merged = perPodcast.flat();

    if (merged.length === 0) {
      return { items: [], cursor: null };
    }

    // sort global feed
    merged.sort((a, b) => {
      if (b.publishedAt !== a.publishedAt) {
        return b.publishedAt - a.publishedAt;
      }
      return b._id.localeCompare(a._id);
    });

    const slice = merged.slice(0, pageSize);

    const last = slice[slice.length - 1];

    return {
      items: slice,
      cursor: last
        ? {
            publishedAt: last?.publishedAt,
            episodeId: last?._id,
          }
        : null,
    };
  },
});

// delete ?? use feed instead
export const recentlyUpdatedUserSubscribed = query({
  args: { limit: v.optional(v.number()) },
  handler: async ({ db, auth }, { limit = 50 }) => {
    const clerkId = await getClerkId(auth);
    const subscriptions = await getUserSubscriptions(db, clerkId);

    const podcastIds = subscriptions.map((s) => s.podcastId);

    if (podcastIds.length === 0) return [];

    const episodesPromises = podcastIds.map((podcastId) =>
      getRecentEpisodes(db, podcastId, 5)
    );

    const episodesArrays = await Promise.all(episodesPromises);

    // Flatten + sort by publishedAt
    const allEpisodes = episodesArrays.flat();

    return allEpisodes
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit); // overall limit
    // return await asyncMap(await getUserSubscriptions(db, clerkId), (sub) =>
    //   getRecentEpisodes(db, sub.podcastId)
    // );
  },
});

export const unauthedRecentEpisodes = query({
  args: { limit: v.optional(v.number()) },
  handler: async ({ db }, { limit = 10 }) => {
    return await db
      .query('episodes')
      .withIndex('by_creation_time')
      .order('desc')
      .take(limit);
  },
});

async function getRecentEpisodes(
  db: QueryCtx['db'],
  podId: string,
  limit = 10
) {
  return await db
    .query('episodes')
    .withIndex('by_podId_pub', (q) => q.eq('podcastId', podId))
    .order('desc')
    .take(limit);
}

export const getById = internalQuery({
  args: { convexId: v.id('episodes') },
  handler: async ({ db }, { convexId }) => {
    return db.get(convexId);
  },
});

export const getByGuid = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    return db
      .query('episodes')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', id))
      .first();
    //.unique(); // TODO: uncomment once the duplication problem is fixed
  },
});

export const saveEpisodesToDb = internalMutation({
  // args: { episodes: Doc<"episodes"> },
  handler: async (
    { db },
    {
      episodes,
      podcastTitle, // not required in case episodes are from multiple podcasts
    }: {
      episodes: (EpisodeItem & { podcastTitle?: string })[];
      podcastTitle?: string;
    }
  ) => {
    // Insert in a loop. This is efficient because Convex queues all the changes
    // to be executed in a single transaction when the mutation ends.
    console.log(
      `adding ${episodes.length} episodes to the database [${podcastTitle}]`
    );
    for (const episode of episodes) {
      const id = await db.insert('episodes', {
        ...podIndexEpToConvexEp(episode, podcastTitle),
      });
    }
    console.log(
      `finished adding ${episodes.length} episodes of ${podcastTitle}`
    );
  },
});

export const getEpEmbByEpId = internalQuery({
  args: { episodeConvexId: v.id('episodes') },
  handler: async ({ db }, { episodeConvexId }) => {
    return await db
      .query('episodeEmbeddings')
      .filter((q) => q.eq(q.field('episodeConvexId'), episodeConvexId))
      .first();
  },
});

export const getEpEmbByEpGuid = internalQuery({
  args: { episodeGuid: v.id('episodes') },
  handler: async ({ db }, { episodeGuid }) => {
    return await db
      .query('episodeEmbeddings')
      .withIndex('by_episodeGuid', (q) => q.eq('episodeGuid', episodeGuid))
      .first();
  },
});

export const fetchEpResults = internalQuery({
  args: { ids: v.array(v.id('episodeEmbeddings')) },
  handler: async (ctx, args) => {
    const results: Doc<'episodes'>[] = [];
    for (const id of args.ids) {
      // const doc = await ctx.db.get(id);
      const doc = await ctx.db
        .query('episodes')
        .withIndex('by_embedding', (q) => q.eq('embeddingId', id))
        .unique();
      if (doc === null) {
        continue;
      }
      results.push(doc);
    }
    return results;
  },
});

// TODO: vector based recommendations
// https://chatgpt.com/s/t_692fd481cc7881918ad60b3b51630c84
export const getSimilarEpisodes = action({
  args: { episodeConvexId: v.id('episodes'), limit: v.optional(v.number()) },
  handler: async (ctx, { episodeConvexId, limit = 4 }) => {
    // const row = await ctx.db
    //   .query('episodeEmbeddings')
    //   .filter((q) => q.eq(q.field('episodeId'), episodeId))
    //   .unique();
    const row: Doc<'episodeEmbeddings'> = await ctx.runQuery(
      internal.episodes.getEpEmbByEpId,
      {
        episodeConvexId,
      }
    );

    if (!row?.embedding) return [];

    let results = await ctx.vectorSearch('episodeEmbeddings', 'by_embedding', {
      vector: row.embedding,
      limit: limit + 1, // include itself
    });

    const similarDocuments: (Doc<'episodes'> | null)[] = await ctx.runQuery(
      internal.episodes.fetchEpResults,
      { ids: results.map((result) => result._id) }
    );

    let filtered = similarDocuments
      .filter((r) => !!r && r?._id !== episodeConvexId)
      .slice(0, limit);

    return filtered;
  },
});

export const getPersonalizedRecommendations = action({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, limit = 10 }) => {
    const listens = await ctx.runQuery(internal.playback.getAllByClerkId, {
      clerkId,
    });
    // const listens = await ctx.db
    //   .query('user_playback')
    //   .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    //   .collect();

    if (!listens || listens.length === 0) return [];

    // const episodeIds = listens.map(l => l.episodeId);
    // const embRows = await ctx.db
    //   .query("episodeEmbeddings")
    //   .withIndex("by_episodeConvexId", q => q.in("episodeConvexId", episodeIds))
    //   .collect();
    const embRows = await asyncMap(listens, async (listen) => {
      return await ctx.runQuery(
        internal.episodes.getEpEmbByEpGuid({ episodeGuid: listen.episodeId })
      );
      // return await ctx.db
      //   .query('episodeEmbeddings')
      //   .withIndex('by_episodeGuid', (q) =>
      //     q.eq('episodeGuid', listen.episodeId)
      //   ).first()
    });
    const filtered = embRows.filter(isNotNullish);

    if (!filtered || filtered.length === 0) return [];

    // compute average vector
    const dim = filtered[0].embedding.length;
    const sum = new Array<number>(dim).fill(0);
    for (const r of filtered) {
      for (let i = 0; i < dim; i++) sum[i] += r.embedding[i];
    }
    const avg = sum.map((v) => v / filtered.length);

    // optional: normalize
    // normalize even if not normalizing when saving vector ??
    const norm = Math.sqrt(avg.reduce((s, x) => s + x * x, 0));
    const queryVector = norm > 0 ? avg.map((x) => x / norm) : avg;

    // vector search
    // const res = await ctx.db
    //   .query("episodeEmbeddings")
    //   .vectorSearch("vector", queryVector, { limit: limit + 4 }) // fetch some extras
    //   .collect();
    const res = await ctx.vectorSearch('episodeEmbeddings', 'by_embedding', {
      vector: queryVector,
      limit: limit + 4, // fetch some extras
    });

    // filter out episodes user already listened to, and return top limit
    const episodeIds = listens.map((l) => l.episodeId);
    const listenedSet = new Set(episodeIds.map(String));
    const filteredResult = res
      .filter((r) => !listenedSet.has(String(r.episodeId)))
      .slice(0, limit);

    return filteredResult.map((r) => ({
      episodeId: r.episodeId,
      metadata: r.metadata,
      score: r.score,
    }));
  },
});

export const saveEpisodeEmbedding = internalMutation({
  args: {
    episodeId: v.id('episodes'),
    embedding: v.array(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async ({ db }, { episodeId, embedding, metadata }) => {
    const episode = await db.get(episodeId);
    if (!episode) throw new Error(`episode not found`);
    const { episodeId: episodeGuid, podcastId } = episode;

    const now = Date.now();
    const embeddingId = await db.insert('episodeEmbeddings', {
      episodeId,
      episodeGuid,
      podcastId,
      embedding,
      metadata: {
        ...metadata,
        language: episode.language || null,
        title: episode.title,
        podcastTitle: episode.podcastTitle,
        publishedAt: episode.publishedAt,
      },
      createdAt: now,
    });

    await db.patch(episode._id, {
      embeddingId: embeddingId,
    });

    return { ok: true };
  },
});

export const generateEpisodeEmbedding = action({
  args: {
    episodeId: v.id('episodes'),
  },
  handler: async (ctx, { episodeId }) => {
    const episode = await ctx.runQuery(internal.episodes.getById, {
      convexId: episodeId,
    });
    if (!episode) throw new Error('Episode not found');

    // build text to embed — tune fields and length
    const text = [
      episode.title,
      episode.summary,
      // episode.showNotes ?? ""
    ]
      .filter(Boolean)
      .join('\n\n');

    const embedding = await createEmbedding(text);

    // optional normalization step for better vector search stability
    // normalizeVector(vector)

    await ctx.runMutation(internal.episodes.saveEpisodeEmbedding, {
      episodeId,
      embedding,
      metadata: {
        title: episode.title,
      },
    });

    return { ok: true };
  },
});

export const getEpisodesWithoutEmbedding = internalQuery({
  args: { podcastId: v.optional(v.string()) },
  handler: async (ctx, { podcastId }) => {
    let q = ctx.db
      .query('episodes')
      .withIndex('by_embedding', (q) => q.eq('embeddingId', undefined));

    if (podcastId) q.filter((x) => x.eq(x.field('podcastId'), podcastId));

    let items = await q.collect();

    return items;
  },
});

// run periodically (cron job) to ensure all episodes are embedded
export const bulkEmbedEpisodes = action({
  args: {
    podcastId: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { podcastId, batchSize = 10 }) => {
    // fetch episodes that don't have embeddings yet
    const episodes = await ctx.runQuery(
      internal.episodes.getEpisodesWithoutEmbedding,
      { podcastId }
    );

    // fetch existing embedding episodeIds
    // const existing = await ctx.db.query("episodeEmbeddings").collect();
    // const existingIds = new Set(existing.map(e => String(e.episodeId)));

    // const toProcess = episodes.filter(e => !existingIds.has(String(e._id))).slice(0, batchSize);
    const toProcess = episodes.slice(0, batchSize);

    for (const ep of toProcess) {
      const text = [ep.title, ep.summary ?? ''].join('\n\n'); // move to helper fn
      try {
        const embedding = await createEmbedding(text);
        await ctx.runMutation(internal.episodes.saveEpisodeEmbedding, {
          episodeId: ep._id,
          embedding,
        });
      } catch (err) {
        // log and continue — robust to API hiccups
        console.error('embed fail', ep._id, err);
      }
    }

    return { processed: toProcess.length };
  },
});

// TODO: appears to be duplicating episodes ??
export const refreshByPodId = action({
  args: { podId: v.string() },
  handler: async (ctx, { podId }) => {
    // TODO: REFACTOR INTO HELPER FUNCTION - SAME AS fetchNewEpisodes
    let mostRecentEpisode = await ctx.runQuery(
      internal.episodes.getMostRecentEpisode,
      { podcastId: podId }
    );
    // TODO: handle no recent episode (for title)
    if (!mostRecentEpisode) return { newEpisodes: 0 };

    let queryOptions = {};
    let since = (mostRecentEpisode?.publishedAt || 0) / 1000 + 1;
    if (since) queryOptions = { since: String(since) };
    let newEpisodes = await fetchPodEpisodesFromIndex(podId, queryOptions);

    console.log(
      `${newEpisodes.length} new episodes found (${mostRecentEpisode?.podcastTitle})`
    );

    let eps = newEpisodes.map((e) => ({
      ...e,
      podcastTitle: mostRecentEpisode?.podcastTitle,
    }));

    await ctx.scheduler.runAfter(0, internal.episodes.saveEpisodesToDb, {
      episodes: eps,
    });

    return { newEpisodes: newEpisodes.length };
  },
});

const POLL_INTERVAL = 1000 * 60 * 30; // 30 minutes

// run by cron job every X amount of time
export const fetchNewEpisodes = internalAction({
  handler: async (ctx) => {
    // fetch podcasts with a last updated date of less than X
    const pods = await ctx.runQuery(internal.episodes.fetchPodcastForRefresh);

    let newEpisodesQueue: (EpisodeItem & { podcastTitle: string })[] = [];

    let podLastUpdated: {
      podId: Id<'podcasts'>;
      lastUpdatedAt: number;
      mostRecentEpisode?: number;
    }[] = [];

    // loop through their feeds & fetch updates
    // get most recent from db and add since ??
    for (let pod of pods) {
      let mostRecentEpisode = await ctx.runQuery(
        internal.episodes.getMostRecentEpisode,
        { podcastId: pod.podcastId }
      );

      let queryOptions = {};
      let since = (mostRecentEpisode?.publishedAt || 0) / 1000 + 1;
      if (since) queryOptions = { since: String(since) };
      let newEpisodes = await fetchPodEpisodesFromIndex(
        pod.podcastId,
        queryOptions
      );

      console.log(`${newEpisodes.length} new episodes found (${pod.title})`);

      for (let episode of newEpisodes) {
        newEpisodesQueue.push({ ...episode, podcastTitle: pod.title });
      }

      if (newEpisodes.length) {
        let update = {
          podId: pod._id,
          lastUpdatedAt: new Date().getTime(),
        };
        let mostRecentEpisode = newEpisodes[0].datePublished;
        if (mostRecentEpisode)
          update['mostRecentEpisode'] = mostRecentEpisode * 1000;
        podLastUpdated.push(update);
      }
    }

    if (podLastUpdated.length) {
      await ctx.scheduler.runAfter(0, internal.episodes.saveEpisodesToDb, {
        episodes: newEpisodesQueue,
      });
    }

    // alternatively/combo - call rss directly:
    // could check if index data seems old: const latestIndexPub = indexData.episodes[0]?.datePublished;
    // const res = await fetch(p.feedUrl);
    // const xml = await res.text();
    // const parsed = parsePodcastFeed(xml); // use rss-parser or fast-xml-parser

    // import Parser from 'rss-parser';

    // async function fetchAndParseRSS(feedUrl: string) {
    //   const parser = new Parser();
    //   const feed = await parser.parseURL(feedUrl);
    //   return feed.items.map(item => ({
    //     guid: item.guid || item.link,
    //     title: item.title,
    //     audioUrl: item.enclosure?.url,
    //     publishedAt: new Date(item.pubDate).getTime(),
    //     duration: item.itunes?.duration,
    //   }));
    // }
  },
});

export const fetchPodcastForRefresh = internalQuery({
  handler: async ({ db }) => {
    // TODO: only poll pods with active subscriptions
    // const podcastsToPoll = await db.query("subscriptions")
    //   .groupBy("podcastId")
    //   .filter(p => subscriberCount > 0)
    // TODO: remove limit ?? or set interval to be shorter than cron
    return await db
      .query('podcasts')
      .filter((q) =>
        q.gt(q.sub(Date.now(), q.field('lastFetchedAt')), POLL_INTERVAL)
      )
      // .filter((q) => Date.now() - (q.lastFetchedAt || 0) > POLL_INTERVAL)
      .take(50);
    // .collect();
  },
});

export const getMostRecentEpisode = internalQuery({
  handler: async ({ db }, { podcastId }: { podcastId: string }) => {
    return db
      .query('episodes')
      .withIndex('by_podId_pub', (e) => e.eq('podcastId', podcastId))
      .order('desc')
      .first(); //.filter(e => e.eq(e.field(podcastId), podcastId))
  },
});

export async function fetchPodEpisodesFromIndex(
  podcastId: string,
  options: { max?: string; since?: string; fullText?: string } = {}
) {
  const params = new URLSearchParams({
    guid: podcastId,
    max: '1000',
    fullText: '',
    ...options,
  });
  const res = await api<EpisodesByPodGuidResult>(
    `episodes/bypodcastguid?${params}`
  );

  if (typeof res.body === 'string' || !res.body.items)
    throw new Error(`podcast not found with ID ${podcastId}`);
  return res.body.items;
}

function podIndexEpToConvexEp(
  ep: EpisodeItem,
  podcastTitle?: string
): WithoutSystemFields<Doc<'episodes'>> {
  return {
    episodeId: ep.guid,
    podcastId: ep.podcastGuid,
    title: ep.title, // @ts-ignore podcastName is returned from episodes api
    podcastTitle: ep.podcastName || ep.podcastTitle || podcastTitle || '',
    audioUrl: ep.enclosureUrl,
    image: ep.image || null,
    enclosureType: ep.enclosureType,
    publishedAt: ep.datePublished * 1000,
    durationSeconds: ep.duration || 0,
    sizeBytes: ep.enclosureLength || null,
    feedUrl: ep.feedUrl || null,
    feedImage: ep.feedImage || null,
    feedItunesId: ep.feedItunesId || null,
    summary: ep.description || '',
    episode: ep.episode || null,
    season: ep.season || null,
    episodeType: ep.episodeType || null,
    explicit: Boolean(ep.explicit),
    language: ep.feedLanguage || null,
    retrievedAt: getTimestamp(),
    transcripts: ep.transcripts || [],
    persons: ep.persons || [],
    socialInteract: ep.socialInteract || [],
    chaptersUrl: ep.chaptersUrl || null,
  };
}
