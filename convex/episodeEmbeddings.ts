import { asyncMap } from 'convex-helpers';
import { api, internal } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from 'convex/_generated/server';
import { getClerkId } from 'convex/utils/auth';
import {
  createEmbedding,
  formatEpisodeEmbeddingText,
} from 'convex/utils/embeddings';
import { isNotNullish } from 'convex/utils/helpers';
import { v } from 'convex/values';

export const saveEpisodeEmbedding = internalMutation({
  args: {
    episodeConvexId: v.id('episodes'),
    embedding: v.array(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async ({ db }, { episodeConvexId, embedding, metadata }) => {
    const episode = await db.get(episodeConvexId);
    if (!episode) throw new Error(`episode not found`);
    const { episodeId: episodeGuid, podcastId } = episode;

    const now = Date.now();
    const embeddingId = await db.insert('episodeEmbeddings', {
      episodeConvexId,
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

// for testing manually - TODO: batch on episode import
export const generateEpisodeEmbedding = action({
  args: {
    episodeConvexId: v.id('episodes'),
  },
  handler: async (ctx, { episodeConvexId }) => {
    const episode = await ctx.runQuery(internal.episodes.getById, {
      convexId: episodeConvexId,
    });
    if (!episode) throw new Error('Episode not found');

    const text = formatEpisodeEmbeddingText(episode);

    const embeddingResult = await createEmbedding(text);
    const embedding = embeddingResult[0].embedding;
    // const embedding = await generateEmbedding(episode);

    // optional normalization step for better vector search stability
    // normalizeVector(vector)

    await ctx.runMutation(internal.episodeEmbeddings.saveEpisodeEmbedding, {
      episodeConvexId,
      embedding,
      metadata: {
        title: episode.title,
      },
    });

    return { ok: true };
  },
});

export const getEpEmbByEpId = query({
  args: { episodeConvexId: v.id('episodes') },
  handler: async ({ db }, { episodeConvexId }) => {
    return await db
      .query('episodeEmbeddings')
      .withIndex('by_episodeConvexId', (q) =>
        q.eq('episodeConvexId', episodeConvexId)
      )
      .first();
  },
});

export const getEpEmbByEpGuid = query({
  args: { episodeGuid: v.string() },
  handler: async ({ db }, { episodeGuid }) => {
    return await db
      .query('episodeEmbeddings')
      .withIndex('by_episodeGuid', (q) => q.eq('episodeGuid', episodeGuid))
      .first();
  },
});

export const getSimilarEpisodes = action({
  args: { episodeConvexId: v.id('episodes'), limit: v.optional(v.number()) },
  handler: async (ctx, { episodeConvexId, limit = 4 }) => {
    // const row = await ctx.db
    //   .query('episodeEmbeddings')
    //   .filter((q) => q.eq(q.field('episodeId'), episodeId))
    //   .unique();
    const row: Doc<'episodeEmbeddings'> | null = await ctx.runQuery(
      api.episodeEmbeddings.getEpEmbByEpId,
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
      internal.episodes.fetchEmbResults,
      { ids: results.map((result) => result._id) }
    );

    let filtered = similarDocuments
      .filter((r) => isNotNullish(r) && r?._id !== episodeConvexId)
      .slice(0, limit);

    return filtered as Doc<'episodes'>[];
  },
});

export const getPersonalizedRecommendations = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10 }) => {
    const clerkId = await getClerkId(ctx.auth);
    const listens: Doc<'user_playback'>[] = await ctx.runQuery(
      internal.playback.getAllByClerkId,
      {
        clerkId,
      }
    );

    if (!listens || listens.length === 0) {
      return await ctx.runQuery(api.episodes.unauthedRecentEpisodes, { limit });
    }

    // const episodeIds = listens.map(l => l.episodeId);
    // const embRows = await ctx.db
    //   .query("episodeEmbeddings")
    //   .withIndex("by_episodeConvexId", q => q.in("episodeConvexId", episodeIds))
    //   .collect();
    const embRows: (Doc<'episodeEmbeddings'> | null)[] = await asyncMap(
      listens,
      async (listen) => {
        return await ctx.runQuery(api.episodeEmbeddings.getEpEmbByEpGuid, {
          episodeGuid: listen.episodeId,
        });
      }
    );
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
      limit: limit + 5, // fetch some extras
    });

    const episodes: Doc<'episodes'>[] = await ctx.runQuery(
      internal.episodes.fetchEmbResults,
      {
        ids: res.map((r) => r._id),
      }
    );

    // TODO: filter out already listened episodes

    // filter out episodes user already listened to, and return top limit
    // TODO: not currently saving convex id to user_playback
    // const episodeIds = listens.map((l) => l.episodeId);
    // const listenedSet = new Set(episodeIds.map(String));
    // const filteredResult = episodes
    //   .filter((r) => !listenedSet.has(String(r._id)))
    //   .slice(0, limit);

    // return filteredResult.map((r) => ({
    //   episodeId: r.episodeId,
    //   metadata: r.metadata,
    //   score: r.score,
    // }));
    return episodes.slice(0, limit);
  },
});

export const getEpisodesWithoutEmbedding = internalQuery({
  args: { podcastId: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { podcastId, limit = 50 }) => {
    if (podcastId) {
      return await ctx.db
        .query('episodes')
        .withIndex('by_embedding', (q) => q.eq('embeddingId', undefined))
        .filter((x) => x.eq(x.field('podcastId'), podcastId))
        .take(limit);
    } else {
      return await ctx.db
        .query('episodes')
        .withIndex('by_embedding', (q) => q.eq('embeddingId', undefined))
        .take(limit);
    }
    // let q = ctx.db
    //   .query('episodes')
    //   .withIndex('by_embedding', (q) => q.eq('embeddingId', undefined));

    // if (podcastId) q.filter((x) => x.eq(x.field('podcastId'), podcastId));

    // let items = await q.collect();

    // return items;
  },
});

// called after new episodes imported (call with <= 10 episodes at a time)
export const embedNewEpisodes = internalAction({
  args: {
    episodeIds: v.array(v.id('episodes')),
  },
  handler: async (ctx, { episodeIds }) => {
    const episodes: (Doc<'episodes'> | null)[] = await ctx.runQuery(
      internal.episodes.getMultipleById,
      {
        convexIds: episodeIds,
      }
    );
    const filtered = episodes.filter(isNotNullish);

    for (const ep of filtered) {
      try {
        // TODO: batch embeddings
        // const embeddingRes = await generateEmbedding(ep);
        const text = formatEpisodeEmbeddingText(ep);
        const embeddingResult = await createEmbedding(text);
        const embedding = embeddingResult[0].embedding;
        await ctx.runMutation(internal.episodeEmbeddings.saveEpisodeEmbedding, {
          episodeConvexId: ep._id,
          embedding,
        });
      } catch (err) {
        // log and continue — robust to API hiccups (TODO: report to sentry)
        console.error('embed fail', ep._id, err);
      }
    }

    return { processed: filtered.length };
  },
});

// TODO: delete the above function and use this instead (less likely to timeout)
// cron job or explicitly call ??
export const embedNewEpisodesBatch = internalAction({
  args: {
    episodeIds: v.array(v.id('episodes')),
  },
  handler: async (ctx, { episodeIds }) => {
    const episodes: (Doc<'episodes'> | null)[] = await ctx.runQuery(
      internal.episodes.getMultipleById,
      {
        convexIds: episodeIds,
      }
    );
    const filtered = episodes.filter(isNotNullish);
    // Build embedding inputs (CLEAN + SHORT)
    const inputs = filtered.map(formatEpisodeEmbeddingText);

    const embeddingResult = await createEmbedding(inputs);

    for (let i = 0; i < filtered.length; i++) {
      await ctx.runMutation(api.mutations.saveEpisodeEmbedding, {
        episodeId: filtered[i]._id,
        vector: embeddingResult[i].embedding,
        metadata: {
          title: filtered[i].title,
        },
      });
    }

    return {
      status: 'ok',
      processed: filtered.length,
    };
  },
});

// run periodically (cron job) to ensure all episodes are embedded
// TODO: change to internal & run as cron job
export const bulkEmbedEpisodes = action({
  args: {
    podcastId: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { podcastId, batchSize = 10 }) => {
    // fetch episodes that don't have embeddings yet
    const episodes: Doc<'episodes'>[] = await ctx.runQuery(
      internal.episodeEmbeddings.getEpisodesWithoutEmbedding,
      { podcastId, limit: batchSize }
    );
    console.log('EMBEDDING EPISODES: ', episodes.length);

    // Build embedding inputs (CLEAN + SHORT)
    const inputs = episodes.map(formatEpisodeEmbeddingText);

    const embeddingResult = await createEmbedding(inputs);

    for (let i = 0; i < episodes.length; i++) {
      await ctx.runMutation(api.mutations.saveEpisodeEmbedding, {
        episodeId: episodes[i]._id,
        vector: embeddingResult[i].embedding,
        metadata: {
          title: episodes[i].title,
        },
      });
    }

    return { processed: episodes.length };
  },
});
