import {
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from 'convex/_generated/server';
import { getTimestamp } from 'convex/playback';
import { WithoutSystemFields } from 'convex/server';
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
    { db },
    { podcastId, ...rest }: WithoutSystemFields<Doc<'podcasts'>>
  ) => {
    // possible to add table constraint (userId & podcastId unique)
    let existingSub = await checkExisting(db, podcastId);

    if (existingSub) return { success: true, new: false };

    const id = await db.insert('podcasts', {
      podcastId,
      ...rest,
      lastFetchedAt: getTimestamp(),
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
        lastUpdatedAt: v.number(),
        mostRecentEpisode: v.optional(v.number()),
      })
    ),
  },
  handler: async ({ db }, { updates }) => {
    for (const { podId, ...rest } of updates) {
      await db.patch(podId, { ...rest });
      // const id = await db.insert('episodes', {
      //   ...podIndexEpToConvexEp(episode, podcastTitle),
      // });
    }
  },
});

async function checkExisting(db: QueryCtx['db'], podId: string) {
  return await db
    .query('podcasts')
    .withIndex('by_podId', (q) => q.eq('podcastId', podId))
    .unique();
}

// movies example https://github.com/get-convex/convex-demos/blob/main/vector-search/convex/movies.ts

// ------ VECTOR EAMPLE --------

// export async function embed(text: string): Promise<number[]> {
//   const key = process.env.OPENAI_KEY;
//   if (!key) {
//     throw new Error("OPENAI_KEY environment variable not set!");
//   }
//   const req = { input: text, model: "text-embedding-3-small" };
//   const resp = await fetch("https://api.openai.com/v1/embeddings", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${key}`,
//     },
//     body: JSON.stringify(req),
//   });
//   if (!resp.ok) {
//     const msg = await resp.text();
//     throw new Error(`OpenAI API error: ${msg}`);
//   }
//   const json = await resp.json();
//   const vector = json["data"][0]["embedding"];
//   console.log(`Computed embedding of "${text}": ${vector.length} dimensions`);
//   return vector;
// }

// export const insert = mutation({
//   args: { title: v.string(), description: v.string(), genre: v.string() },
//   handler: async (ctx, args) => {
//     const movieId = await ctx.db.insert("movies", {
//       description: args.description,
//       genre: args.genre,
//       title: args.title,
//       votes: 0,
//     });
//     // Kick off an action to generate an embedding for this movie
//     await ctx.scheduler.runAfter(0, internal.movies.generateAndAddEmbedding, {
//       movieId,
//       description: args.description,
//     });
//   },
// });

// export const generateAndAddEmbedding = internalAction({
//   args: { movieId: v.id("movies"), description: v.string() },
//   handler: async (ctx, args) => {
//     const embedding = await embed(args.description);
//     await ctx.runMutation(internal.movies.addEmbedding, {
//       movieId: args.movieId,
//       embedding,
//     });
//   },
// });

// export const addEmbedding = internalMutation({
//   args: { movieId: v.id("movies"), embedding: v.array(v.number()) },
//   handler: async (ctx, args) => {
//     const movie = await ctx.db.get(args.movieId);
//     if (movie === null) {
//       // No movie to update
//       return;
//     }
//     const movieEmbeddingId = await ctx.db.insert("movieEmbeddings", {
//       embedding: args.embedding,
//       genre: movie.genre,
//     });
//     await ctx.db.patch(args.movieId, {
//       embeddingId: movieEmbeddingId,
//     });
//   },
// });

// // RUNNING VECTOR SEARCH: https://docs.convex.dev/search/vector-search#running-vector-searches
// // export const findSimilar = action({
// //   args: {
// //     descriptionQuery: v.string(),
// //   },
// //   handler: async (ctx, args) => {
// //     // 1. Generate an embedding from your favorite third party API:
// //     const embedding = await embed(args.descriptionQuery);
// //     // 2. Then search for similar foods!
// //     const results = await ctx.vectorSearch("foods", "by_embedding", {
// //       vector: embedding,
// //       limit: 16,
// //       filter: (q) => q.eq("cuisine", "French"),
// //     });
// //     // ...
// //   },
// // })
