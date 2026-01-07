import { getAll } from 'convex-helpers/server/relationships';
import { api, internal } from 'convex/_generated/api';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { getTimestamp } from 'convex/playback';
import { WithoutSystemFields } from 'convex/server';
import { calcAverageVector, createEmbedding } from 'convex/utils/embeddings';
import { isNotNullish } from 'convex/utils/helpers';
import { v } from 'convex/values';
import { Doc } from '../convex/_generated/dataModel';

export const add = internalMutation({
  // {
  //   podcastId: v.string(),
  //   feedUrl: v.string(),
  //   title: v.string(),
  //   description: v.string(),
  //   imageUrl: v.union(v.string(), v.null()),
  //   itunesId: v.union(v.number(), v.null()),
  // },
  handler: async (
    { db, scheduler },
    { podcastId, ...rest }: WithoutSystemFields<Doc<'podcasts'>>
  ) => {
    // possible to add table constraint (userId & podcastId unique) ??
    let existingSub = await checkExisting(db, podcastId);

    if (existingSub) return { success: true, new: false };

    const id = await db.insert('podcasts', {
      podcastId,
      ...rest,
      lastFetchedAt: getTimestamp(),
    });

    // TODO: use RAG component for embedding ??
    // should podcast embedding be recomputed from episode summaries ??
    // add embedding to podcast
    await scheduler.runAfter(0, internal.podcasts.generateEmbedding, {
      podConvexId: id,
    });

    return { success: true, new: true, id };
  },
});

export const exists = internalQuery({
  args: { podcastId: v.string() },
  handler: async ({ db }, { podcastId }) => {
    // return Boolean(await checkExisting(db, podcastId));
    let pod = await checkExisting(db, podcastId);
    let exists = Boolean(pod);
    return { exists, convexId: pod?._id || null };
  },
});

export const getPodById = internalQuery({
  args: { podcastId: v.id('podcasts') },
  handler: async ({ db }, { podcastId }) => {
    return db.get(podcastId);
  },
});

export const getPodByGuid = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    return db
      .query('podcasts')
      .withIndex('by_podId', (q) => q.eq('podcastId', id))
      .unique();
  },
});

export const setLastUpdated = internalMutation({
  args: {
    updates: v.array(
      v.object({
        podId: v.id('podcasts'),
        lastFetchedAt: v.number(),
        mostRecentEpisode: v.optional(v.number()),
      })
    ),
  },
  handler: async ({ db }, { updates }) => {
    for (const { podId, ...rest } of updates) {
      await db.patch(podId, { ...rest });
    }
  },
});

export const getAllById = internalQuery({
  args: { convexIds: v.array(v.id('podcasts')) },
  handler: async ({ db }, { convexIds }) => {
    return await getAll(db, convexIds);
  },
});

export const recentlyUpdated = query({
  args: { limit: v.optional(v.number()) },
  handler: async ({ db }, { limit = 8 }): Promise<Doc<'podcasts'>[]> => {
    return await db
      .query('podcasts')
      // .withIndex('by_lastFetched')
      .withIndex('by_mostRecentEp')
      .order('desc')
      .take(limit);
  },
});

async function checkExisting(db: QueryCtx['db'], podId: string) {
  return await db
    .query('podcasts')
    .withIndex('by_podId', (q) => q.eq('podcastId', podId))
    .unique();
}

// ------- VECTOR ------ //

export const saveEmbedding = internalMutation({
  args: {
    podConvexId: v.id('podcasts'),
    embedding: v.array(v.number()),
  },
  handler: async ({ db }, { podConvexId, embedding }) => {
    console.log(`saving embedding for podcast ${podConvexId}...`);
    await db.patch(podConvexId, {
      embedding,
    });

    return { ok: true };
  },
});

export const generateEmbedding = internalAction({
  args: {
    podConvexId: v.id('podcasts'),
  },
  handler: async (ctx, { podConvexId }) => {
    const pod = await ctx.runQuery(internal.podcasts.getPodById, {
      podcastId: podConvexId,
    });
    if (!pod) throw new Error(`pod not found`);
    const { title, description, categories } = pod;

    const embedding = await getEmbedding(title, description, categories);

    const result: { ok: boolean } = await ctx.runMutation(
      internal.podcasts.saveEmbedding,
      {
        podConvexId,
        embedding,
      }
    );
    return result;
  },
});

export const getEmbResults = internalQuery({
  args: { ids: v.array(v.id('podcasts')) },
  handler: async ({ db }, { ids }) => {
    return await getAll(db, ids);
  },
});

export const getSimilarPodcasts = action({
  args: { podId: v.string(), limit: v.optional(v.number()) }, // podId: v.id('podcasts')
  handler: async (ctx, { podId, limit = 4 }) => {
    const row: Doc<'podcasts'> | null = await ctx.runQuery(
      api.podcasts.getPodByGuid,
      {
        id: podId,
      }
    );

    if (!row?.embedding) return [];

    const results = await ctx.vectorSearch('podcasts', 'by_embedding', {
      vector: row.embedding,
      limit: limit + 1,
    });

    const podcasts: (Doc<'podcasts'> | null)[] = await ctx.runQuery(
      internal.podcasts.getEmbResults,
      { ids: results.map((r) => r._id) }
    );

    return podcasts.filter(
      (p) => isNotNullish(p) && p.podcastId !== podId
    ) as Doc<'podcasts'>[];
  },
});

export const getPersonalizedRecommendations = action({
  args: {
    // clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10 }) => {
    // const clerkId = await getClerkId(ctx.auth);

    // TODO: need to add podcastId to playback
    // const listens: Doc<'user_playback'>[] = await ctx.runQuery(
    //   internal.playback.getAllByClerkId,
    //   { clerkId }
    // );
    // if (!listens || listens.length === 0) return [];
    // const podIds = listens.map(l => l.podcastId)
    // const uniqueArray = [...new Set(podIds)];

    const subscribed = await ctx.runQuery(api.subscribe.all);

    // TODO: return fallback to most listened
    // https://github.com/get-convex/aggregate/blob/main/example/convex/shuffle.ts
    if (!subscribed?.length) {
      const recentlyUpdated: Doc<'podcasts'>[] = await ctx.runQuery(
        api.podcasts.recentlyUpdated,
        { limit }
      );
      return recentlyUpdated;
    }

    const podIds = subscribed.map((s) => s.podConvexId);

    const pods = await ctx.runQuery(internal.podcasts.getAllById, {
      convexIds: podIds,
    });

    const filtered = pods.filter(
      (p) => isNotNullish(p) && p.embedding !== undefined
    );
    if (!filtered || filtered.length === 0) return [];

    // compute average vector
    const queryVector = calcAverageVector(filtered.map((f) => f.embedding));

    const results = await ctx.vectorSearch('podcasts', 'by_embedding', {
      vector: queryVector,
      limit: limit + 5, // add more if filtering out already subscribed
    });

    // optionally filter out already subscribed ??

    const podcasts: (Doc<'podcasts'> | null)[] = await ctx.runQuery(
      internal.podcasts.getEmbResults,
      { ids: results.map((r) => r._id) }
    );

    return podcasts.filter(isNotNullish).slice(0, limit);
  },
});

// manually trigger for old subscribed in dev
export const embedPod = action({
  args: { convexId: v.id('podcasts') },
  handler: async (ctx, { convexId }) => {
    await ctx.scheduler.runAfter(0, internal.podcasts.generateEmbedding, {
      podConvexId: convexId,
    });
  },
});

// TODO: cron job to create embedding for pods added previously ??

export async function getEmbedding(
  title: string,
  description: string,
  categories?: string
) {
  const text = [title, description, categories ?? ''].join('\n\n');
  const embeddingResult = await createEmbedding(text);
  return embeddingResult[0].embedding;
}
