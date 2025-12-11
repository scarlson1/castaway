import { openai } from '@ai-sdk/openai';
import { RAG } from '@convex-dev/rag';
import { components } from 'convex/_generated/api';
import { action, internalMutation } from 'convex/_generated/server';
import { v } from 'convex/values';

export const textEmbeddingModel = 'text-embedding-3-small';
const embeddingDimension = 1536;

const defaultNamespace = 'global';

export type Filters = { podcastId: string; category: string | null };
type Metadata = {
  podcastId: string;
  podcastTitle: string;
  episodeId: string;
  episodeTitle: string;
  publishedAt: number;
};

export const rag = new RAG<Filters, Metadata>(components.rag, {
  textEmbeddingModel: openai.embedding(textEmbeddingModel),
  embeddingDimension,
  filterNames: ['podcastId', 'category'],
});

export const insertEpisodeTranscript = internalMutation({
  args: {
    // transcript: v.string(),
    // episodeId: v.string(),
    // episodeTitle: v.string(),
    // podcastId: v.string(),
    // podcastTitle: v.string(),
    // publishedAt: v.number(),
    // category: v.optional(v.string()),
    episodeId: v.string(),
    transcript: v.string(),
  },
  handler: async (ctx, { episodeId, transcript }) => {
    const episode = await ctx.db
      .query('episodes')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
      .first();
    if (!episode) throw new Error(`episode not found [ID: ${episodeId}]`);

    const { entryId, created } = await rag.add(ctx, {
      namespace: defaultNamespace, // 'episodes', // use episodeId ?? searching within episode ??

      title: episode.episodeId,
      key: episode.episodeId,
      metadata: {
        podcastId: episode.podcastId,
        podcastTitle: episode.podcastTitle,
        episodeId: episode.episodeId,
        episodeTitle: episode.title,
        publishedAt: episode.publishedAt,
      },
      // contentHash: await contentHashFromArrayBuffer(args.transcript) // To avoid re-inserting if the file contents haven't changed.

      text: transcript,

      filterValues: [
        {
          name: 'podcastId',
          value: episode.podcastId,
        },
        {
          name: 'category',
          value: null, // TODO: pod category not stored on episode (add to episode or fetch pod ??)
        },
      ],
      // onComplete: internal.example.recordUploadMetadata, // Called when the entry is ready (transactionally safe with listing).
    });

    if (!created) {
      console.debug('entry already exists, skipping upload metadata');
      // await ctx.storage.delete(storageId);
    }
    // return { url: (await ctx.storage.getUrl(storageId))!, entryId };
    return { entryId };
  },
});

export const search = action({
  args: {
    query: v.string(),
    globalNamespace: v.boolean(),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    // const userId = await getUserId(ctx);
    // if (!userId) throw new Error("Unauthorized");
    const results = await rag.search(ctx, {
      namespace: defaultNamespace, // args.globalNamespace ? "global" : userId,
      query: args.query,
      limit: args.limit ?? 10,
      // filters: [{ name: "category", value: args.category }],
      chunkContext: args.chunkContext,
    });

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
      model: 'openai/gpt-4o-mini', // openai.chat("gpt-4o-mini"),
    });
    return {
      answer: text,
      ...context,
      // files: await toFiles(ctx, context.entries),
    };
  },
});
