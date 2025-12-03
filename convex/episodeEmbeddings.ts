import { asyncMap } from 'convex-helpers';
import { internal } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import {
  action,
  internalMutation,
  internalQuery,
} from 'convex/_generated/server';
import { createEmbedding } from 'convex/utils/embeddings';
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

export const generateEpisodeEmbedding = action({
  args: {
    episodeConvexId: v.id('episodes'),
  },
  handler: async (ctx, { episodeConvexId }) => {
    const episode = await ctx.runQuery(internal.episodes.getById, {
      convexId: episodeConvexId,
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

export const getSimilarEpisodes = action({
  args: { episodeConvexId: v.id('episodes'), limit: v.optional(v.number()) },
  handler: async (ctx, { episodeConvexId, limit = 4 }) => {
    // const row = await ctx.db
    //   .query('episodeEmbeddings')
    //   .filter((q) => q.eq(q.field('episodeId'), episodeId))
    //   .unique();
    const row: Doc<'episodeEmbeddings'> | null = await ctx.runQuery(
      internal.episodeEmbeddings.getEpEmbByEpId,
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
    const listens: Doc<'user_playback'>[] = await ctx.runQuery(
      internal.playback.getAllByClerkId,
      {
        clerkId,
      }
    );
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
        internal.episodeEmbeddings.getEpEmbByEpGuid({
          episodeGuid: listen.episodeId,
        })
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
      limit: limit + 5, // fetch some extras
    });

    const episodes = await ctx.runQuery(internal.episodes.fetchEmbResults, {
      ids: res.map((r) => r._id),
    });

    // filter out episodes user already listened to, and return top limit
    const episodeIds = listens.map((l) => l.episodeId);
    const listenedSet = new Set(episodeIds.map(String));
    const filteredResult = episodes
      .filter((r) => !listenedSet.has(String(r.episodeConvexId)))
      .slice(0, limit);

    return filteredResult.map((r) => ({
      episodeId: r.episodeId,
      metadata: r.metadata,
      score: r.score,
    }));
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
      internal.episodeEmbeddings.getEpisodesWithoutEmbedding,
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
        await ctx.runMutation(internal.episodeEmbeddings.saveEpisodeEmbedding, {
          episodeConvexId: ep._id,
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
