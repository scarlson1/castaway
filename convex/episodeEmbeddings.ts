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
  calcAverageVector,
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

// TODO: use rag component (use rag.embed(concatenatedSummaries of all the previously listened episodes) to produce user interest)
// TODO: occasionally compute user taste vector (cron) & save to user doc
export const getPersonalizedRecommendations = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10 }): Promise<Doc<'episodes'>[]> => {
    const clerkId = await getClerkId(ctx.auth);
    const user = await ctx.runQuery(internal.users.getUser, { clerkId });
    let queryVector = user?.interestEmbedding;

    if (!queryVector) {
      const listens: Doc<'user_playback'>[] = await ctx.runQuery(
        internal.playback.getAllByClerkId,
        {
          clerkId,
        }
      );

      if (!listens || listens.length === 0) {
        return await ctx.runQuery(api.episodes.unauthedRecentEpisodes, {
          limit,
        });
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

      queryVector = calcAverageVector(filtered.map((f) => f.embedding));
    }

    // vector search
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

      // save to RAG component (duplicates embedding, but unable to get vector directly by episode ID for computing user interest average vector)
      await ctx.scheduler.runAfter(0, internal.rag.insertEpisodeTranscript, {
        episodeId: ep.episodeId,
        title: ep.title,
        summary: ep.summary,
        keyTopics: [],
      });
    }

    return { processed: filtered.length };
  },
});

// TODO: delete the above function and use this instead (less likely to timeout)
// cron job or explicitly call ??
// export const embedNewEpisodesBatch = internalAction({
//   args: {
//     episodeIds: v.array(v.id('episodes')),
//   },
//   handler: async (ctx, { episodeIds }) => {
//     const episodes: (Doc<'episodes'> | null)[] = await ctx.runQuery(
//       internal.episodes.getMultipleById,
//       {
//         convexIds: episodeIds,
//       }
//     );
//     const filtered = episodes.filter(isNotNullish);
//     // Build embedding inputs (CLEAN + SHORT)
//     const inputs = filtered.map(formatEpisodeEmbeddingText);

//     const embeddingResult = await createEmbedding(inputs);

//     for (let i = 0; i < filtered.length; i++) {
//       await ctx.runMutation(api.mutations.saveEpisodeEmbedding, {
//         episodeId: filtered[i]._id,
//         vector: embeddingResult[i].embedding,
//         metadata: {
//           title: filtered[i].title,
//         },
//       });
//     }

//     return {
//       status: 'ok',
//       processed: filtered.length,
//     };
//   },
// });

export const getOldEmbeddings = internalQuery({
  args: { cutoff: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, { cutoff, limit = 200 }) => {
    return await ctx.db
      .query('episodeEmbeddings')
      .withIndex('by_creation_time', (q) => q.lt('_creationTime', cutoff))
      .take(limit);
  },
});

export const deleteEmbeddingsBatch = internalMutation({
  args: {
    items: v.array(
      v.object({
        embeddingId: v.id('episodeEmbeddings'),
        episodeConvexId: v.id('episodes'),
      })
    ),
  },
  handler: async (ctx, { items }) => {
    for (const { embeddingId, episodeConvexId } of items) {
      const embedding = await ctx.db.get(embeddingId);
      if (embedding) await ctx.db.delete(embeddingId);

      const episode = await ctx.db.get(episodeConvexId);
      if (episode?.embeddingId) await ctx.db.patch(episodeConvexId, { embeddingId: undefined });
    }
  },
});

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export const pruneOldEpisodeEmbeddings = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, { batchSize = 200 }) => {
    const cutoff = Date.now() - FOUR_WEEKS_MS;

    const old = await ctx.runQuery(
      internal.episodeEmbeddings.getOldEmbeddings,
      { cutoff, limit: batchSize }
    );

    if (!old.length) {
      console.log('No old episode embeddings to prune');
      return { deleted: 0 };
    }

    await ctx.runMutation(internal.episodeEmbeddings.deleteEmbeddingsBatch, {
      items: old.map((e) => ({
        embeddingId: e._id,
        episodeConvexId: e.episodeConvexId,
      })),
    });

    for (const embedding of old) {
      await ctx.scheduler.runAfter(0, internal.rag.deleteByKey, {
        key: embedding.episodeGuid,
        noThrow: true,
      });
    }

    console.log(`Pruned ${old.length} episode embeddings older than 4 weeks`);

    // Schedule another run if there may be more
    if (old.length === batchSize) {
      await ctx.scheduler.runAfter(
        0,
        internal.episodeEmbeddings.pruneOldEpisodeEmbeddings,
        { batchSize }
      );
    }

    return { deleted: old.length };
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
