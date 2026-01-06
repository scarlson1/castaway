import { openai } from '@ai-sdk/openai';
import { RAG, vNamespaceId } from '@convex-dev/rag';
import { api, components } from 'convex/_generated/api';
import { action, internalAction } from 'convex/_generated/server';
import { v } from 'convex/values';

// TODO: remove from RAG when doc is deleted ??

const embeddingDimension = 1536;

export const defaultNamespace = 'global';

export type Filters = {
  podcastId: string;
  category: string | null;
  object: string | null;
};
type Metadata = {
  image?: string | null;
  podcastId: string;
  podcastTitle: string;
  episodeId?: string | null;
  episodeTitle?: string;
  publishedAt?: number | null;
  durationSeconds?: number | null;
  audioUrl?: string | null;
};

export const rag = new RAG<Filters, Metadata>(components.rag, {
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
        .join('/n/n'),

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

// export const insertEpisodeTranscript = internalMutation({
//   args: {
//     episodeId: v.string(),
//     // transcript: v.string(),
//     title: v.string(),
//     summary: v.string(),
//     keyTopics: v.array(v.string()),
//   },
//   handler: async (ctx, { episodeId, title, summary, keyTopics }) => {
//     const episode = await ctx.db
//       .query('episodes')
//       .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
//       .first();
//     if (!episode) throw new Error(`episode not found [ID: ${episodeId}]`);

//     console.log(
//       `Adding transcript to RAG component [episode ID: ${episodeId}]...`
//     );

//     const { entryId, created } = await rag.add(ctx, {
//       namespace: defaultNamespace, // 'episodes', // use episodeId ?? searching within episode ?? use filter (object = 'episode' or object = 'podcast')

//       title: episode.episodeId,
//       key: episode.episodeId,
//       metadata: {
//         podcastId: episode.podcastId,
//         podcastTitle: episode.podcastTitle,
//         episodeId: episode.episodeId,
//         episodeTitle: episode.title,
//         publishedAt: episode.publishedAt,
//       },
//       // contentHash: await contentHashFromArrayBuffer(args.transcript) // To avoid re-inserting if the file contents haven't changed (for files)

//       text: [
//         title ? `Title: ${title}` : '',
//         summary ? `Summary: ${summary}` : '',
//         keyTopics.join(', '),
//       ]
//         .filter(Boolean)
//         .join('/n/n'),

//       filterValues: [
//         {
//           name: 'podcastId',
//           value: episode.podcastId,
//         },
//         {
//           name: 'category',
//           value: null, // TODO: pod category not stored on episode (add to episode or fetch pod ??)
//         },
//         {
//           name: 'object',
//           value: 'episode', // TODO: pod category not stored on episode (add to episode or fetch pod ??)
//         },
//       ],
//       // onComplete: internal.example.recordUploadMetadata, // Called when the entry is ready (transactionally safe with listing).
//     });

//     if (!created) {
//       console.debug('entry already exists, skipping upload metadata');
//       // await ctx.storage.delete(storageId);
//     }

//     return { entryId };
//   },
// });

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
      filters?: { name: keyof Filters; value: string }[];
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
