import { openai } from '@ai-sdk/openai';
import { RAG } from '@convex-dev/rag';
import { components } from 'convex/_generated/api';
import { action, internalMutation } from 'convex/_generated/server';
import { languageModel, textEmbeddingModel } from 'convex/agent/models';
import { v } from 'convex/values';

const embeddingDimension = 1536;

export const defaultNamespace = 'global';

export type Filters = {
  podcastId: string;
  category: string | null;
  object: string | null;
};
type Metadata = {
  podcastId: string;
  podcastTitle: string;
  episodeId?: string | null;
  episodeTitle?: string;
  publishedAt?: number | null;
};

export const rag = new RAG<Filters, Metadata>(components.rag, {
  textEmbeddingModel: openai.embedding(textEmbeddingModel),
  embeddingDimension,
  filterNames: ['podcastId', 'category', 'object'],
});

// TODO: need to update to use title + summary + tags instead of transcript ??
export const insertEpisodeTranscript = internalMutation({
  args: {
    episodeId: v.string(),
    // transcript: v.string(),
    title: v.string(),
    summary: v.string(),
    keyTopics: v.array(v.string()),
  },
  handler: async (ctx, { episodeId, title, summary, keyTopics }) => {
    const episode = await ctx.db
      .query('episodes')
      .withIndex('by_episodeId', (q) => q.eq('episodeId', episodeId))
      .first();
    if (!episode) throw new Error(`episode not found [ID: ${episodeId}]`);

    const { entryId, created } = await rag.add(ctx, {
      namespace: defaultNamespace, // 'episodes', // use episodeId ?? searching within episode ?? use filter (object = 'episode' or object = 'podcast')

      title: episode.episodeId,
      key: episode.episodeId,
      metadata: {
        podcastId: episode.podcastId,
        podcastTitle: episode.podcastTitle,
        episodeId: episode.episodeId,
        episodeTitle: episode.title,
        publishedAt: episode.publishedAt,
      },
      // contentHash: await contentHashFromArrayBuffer(args.transcript) // To avoid re-inserting if the file contents haven't changed (for files)

      text: title + ' ' + summary + ' ' + keyTopics.join(' '),

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

// delete ?? use directly as a tool if not calling directly ??
export const searchEpisodes = action({
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
      model: languageModel, // 'openai/gpt-4o-mini', // openai.chat("gpt-4o-mini"),
    });
    return {
      answer: text,
      ...context,
      // files: await toFiles(ctx, context.entries),
    };
  },
});
