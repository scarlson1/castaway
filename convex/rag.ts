import { openai } from '@ai-sdk/openai';
import { RAG, vNamespaceId } from '@convex-dev/rag';
import { asyncMap } from 'convex-helpers';
import { api, components, internal } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import {
  action,
  internalAction,
  internalMutation,
} from 'convex/_generated/server';
import { calcAverageVector } from 'convex/utils/embeddings';
import { isNotNullish } from 'convex/utils/helpers';
import { v } from 'convex/values';

// TODO: remove from RAG when doc is deleted ??

const embeddingDimension = 1536;

export const defaultNamespace = 'global';

export type RagFilters = {
  podcastId: string;
  category: string | null;
  object: string | null;
};
type RagMetadata = {
  image?: string | null;
  podcastId: string;
  podcastTitle: string;
  episodeId?: string | null;
  episodeTitle?: string;
  publishedAt?: number | null;
  durationSeconds?: number | null;
  audioUrl?: string | null;
};

export const rag = new RAG<RagFilters, RagMetadata>(components.rag, {
  textEmbeddingModel: openai.embedding('text-embedding-3-small'), // openai.embedding(embeddingModelName),
  embeddingDimension,
  filterNames: ['podcastId', 'category', 'object'],
});

export const insertEpisodeTranscript = internalAction({
  args: {
    episodeId: v.string(),
    // transcript: v.string(),
    title: v.string(),
    summary: v.string(),
    keyTopics: v.array(v.string()),
  },
  handler: async (ctx, { episodeId, title, summary, keyTopics }) => {
    const episode = await ctx.runQuery(api.episodes.getByGuid, {
      id: episodeId,
    });
    if (!episode) throw new Error(`episode not found [ID: ${episodeId}]`);

    console.log(
      `Adding transcript to RAG component [episode ID: ${episodeId}]...`
    );

    const { entryId, created } = await rag.add(ctx, {
      namespace: defaultNamespace, // 'episodes', // use episodeId ?? searching within episode ?? use filter (object = 'episode' or object = 'podcast')

      title: episode.title,
      key: episode.episodeId,
      metadata: {
        image: episode.image,
        podcastId: episode.podcastId,
        podcastTitle: episode.podcastTitle,
        episodeId: episode.episodeId,
        episodeTitle: episode.title,
        publishedAt: episode.publishedAt,
        durationSeconds: episode.durationSeconds,
        audioUrl: episode.audioUrl,
      },
      // contentHash: await contentHashFromArrayBuffer(args.transcript) // To avoid re-inserting if the file contents haven't changed (for files)

      text: [
        title ? `Title: ${title}` : '',
        summary ? `Summary: ${summary}` : '',
        keyTopics.join(', '),
      ]
        .filter(Boolean)
        .join('\n\n'),

      filterValues: [
        {
          name: 'podcastId',
          value: episode.podcastId,
        },
        {
          name: 'category',
          value: null, // TODO: pod category not stored on episode (add to episode or fetch pod ??)
        },
        {
          name: 'object',
          value: 'episode', // TODO: pod category not stored on episode (add to episode or fetch pod ??)
        },
      ],
      // onComplete: internal.example.recordUploadMetadata, // Called when the entry is ready (transactionally safe with listing).
    });

    if (!created) {
      console.debug('entry already exists, skipping upload metadata');
      // await ctx.storage.delete(storageId);
    }

    return { entryId };
  },
});

// can be called directly from client for search

const filterName = v.union(
  v.literal('podcastId'),
  v.literal('category'),
  v.literal('object')
);

export const search = action({
  args: {
    query: v.string(),
    // podcastId: v.optional(v.string()),
    // filters: v.optional(v.array(vNamedFilter)),
    filters: v.optional(
      v.array(
        v.object({
          name: filterName,
          value: v.string(), // v.union(v.string(), v.null())
        })
      )
    ),
    globalNamespace: v.boolean(),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    // const userId = await getUserId(ctx);
    // if (!userId) throw new Error("Unauthorized");
    let queryArgs: {
      namespace: string;
      query: string | Array<number>;
      limit?: number;
      chunkContext?: {
        before: number;
        after: number;
      };
      vectorScoreThreshold?: number;
      filters?: { name: keyof RagFilters; value: string }[];
    } = {
      namespace: defaultNamespace, // args.globalNamespace ? "global" : userId,
      query: args.query,
      limit: args.limit ?? 10,
      // filters: [{ name: "category", value: args.category }],
      // chunkContext: args.chunkContext,
      // vectorScoreThreshold: 0.5,
      filters: args.filters,
    };

    const results = await rag.search(ctx, queryArgs);

    // return { ...results, files: await toFiles(ctx, results.entries) };
    return results;
  },
});

export const askQuestion = action({
  args: {
    prompt: v.string(),
    globalNamespace: v.boolean(),
    filter: v.optional(
      v.union(
        v.object({
          name: v.literal('category'),
          value: v.union(v.null(), v.string()),
        }),
        v.object({ name: v.literal('podcastId'), value: v.string() })
      )
    ),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    // const userId = await getUserId(ctx);
    // if (!userId) throw new Error("Unauthorized");
    const { text, context } = await rag.generateText(ctx, {
      search: {
        namespace: defaultNamespace, // args.globalNamespace ? "global" : userId,
        filters: args.filter ? [args.filter] : [],
        limit: args.limit ?? 10,
        chunkContext: args.chunkContext ?? { before: 1, after: 1 },
      },
      prompt: args.prompt,
      model: 'openai/gpt-4o-mini', // languageModelName, // languageModel, // 'openai/gpt-4o-mini', // openai.chat("gpt-4o-mini"),
    });
    return {
      answer: text,
      ...context,
      // files: await toFiles(ctx, context.entries),
    };
  },
});

export const deleteByKey = internalAction({
  args: {
    key: v.string(),
    namespace: v.optional(vNamespaceId),
    noThrow: v.optional(v.boolean()),
  },
  handler: async (ctx, { key, namespace = defaultNamespace, noThrow }) => {
    const namespaceResult = await rag.getNamespace(ctx, { namespace });
    if (!namespaceResult) {
      if (noThrow) return;
      throw new Error(`namespace not found [${namespace}]`);
    }
    const { namespaceId } = namespaceResult;

    await rag.deleteByKeyAsync(ctx, { key, namespaceId });
  },
});

// compute user interest vector
export const computeUserInterestEmbedding = internalAction({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    // fetch user playback
    const playback: Doc<'user_playback'>[] = await ctx.runQuery(
      internal.playback.getAllByClerkId,
      {
        clerkId,
      }
    );
    // TODO: move to separate fn - should never happen b/c fn in called from playback within last 24 hours
    if (!playback.length) return;
    const episodeIds = playback.map((p) => p.episodeId);

    // could combine vectors from the user's subscribed podcasts to capture topics the user is interested in by may not have listened (but playback = revealed preference)

    // get embeddings for played episodes ?? or use existing embedding and recalc with new episodes ?? or get episode summaries and calc new embedding ??

    // unable to query embedding in RAG component directly by episodeId ==> need to use episodeEmbeddings
    const embRows: (Doc<'episodeEmbeddings'> | null)[] = await asyncMap(
      episodeIds,
      async (episodeGuid: string) => {
        return await ctx.runQuery(api.episodeEmbeddings.getEpEmbByEpGuid, {
          episodeGuid,
        });
      }
    );
    const filtered = embRows.filter(isNotNullish);
    if (!filtered || filtered.length === 0) return [];

    // compute pref embedding
    const interestEmbedding = calcAverageVector(
      filtered.map((f) => f.embedding)
    );

    // save to user doc
    await ctx.runMutation(internal.users.updateByClerkId, {
      clerkId,
      updates: { interestEmbedding },
    });
  },
});

export const calcInterestEmbeddingFromFollowing = internalAction({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const subscribed: Doc<'subscriptions'>[] = await ctx.runQuery(
      internal.subscribe.allByClerkId,
      { clerkId }
    );
    const podIds = subscribed.map((s) => s.podConvexId).filter(isNotNullish);
    if (podIds.length) {
      const pods = await ctx.runQuery(internal.podcasts.getAllById, {
        convexIds: podIds,
      });
      const embeddings = pods.map((p) => p?.embedding).filter(isNotNullish);
      if (!embeddings.length) return;

      const avgVector = calcAverageVector(embeddings);
      await ctx.runMutation(internal.users.updateByClerkId, {
        clerkId,
        updates: { interestEmbedding: avgVector },
      });
    }
  },
});

// fetch users with listening history within the last 24 hours
export const getUsersForInterestEmbedding = internalMutation({
  handler: async (ctx) => {
    const playback = await ctx.db
      .query('user_playback')
      .withIndex('by_creation_time', (q) =>
        q.gt('_creationTime', Date.now() - minusTwentyFourHours())
      )
      .collect();

    const userIds = playback.map((p) => p.clerkId);
    const uniqueUserIds = [...new Set(userIds)];

    for (let clerkId of uniqueUserIds) {
      await ctx.scheduler.runAfter(
        0,
        internal.rag.computeUserInterestEmbedding,
        {
          clerkId,
        }
      );
    }

    const usersWithoutEmbedding = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('interestEmbedding'), undefined))
      .collect();
    for (let u of usersWithoutEmbedding) {
      await ctx.scheduler.runAfter(
        0,
        internal.rag.calcInterestEmbeddingFromFollowing,
        { clerkId: u.clerkId }
      );
    }
  },
});

function minusTwentyFourHours() {
  return Date.now() - 86400000; // 1 day in ms
}
