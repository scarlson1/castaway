import { createTool } from '@convex-dev/agent';
import type { SearchResult } from '@convex-dev/rag';
import { defaultNamespace, rag } from 'convex/rag';
import z from 'zod';

export const searchEpisodes = createTool({
  description: 'search podcast episodes',
  args: z.object({
    query: z.string().describe("describe the context you're looking for"),
    category: z.string().describe('optionally filter by category').optional(),
  }),
  handler: async (ctx, args): Promise<SearchResult[]> => {
    const searchArgs: {
      namespace: string;
      query: string | Array<number>;
      limit?: number;
      filters?: { name: 'podcastId' | 'category'; value: string }[];
    } = {
      namespace: defaultNamespace, // args.globalNamespace ? "global" : userId,
      query: args.query,
      limit: 5,
      // filters: [{ name: "category", value: args.category }],
      // chunkContext: args.chunkContext,
    };
    if (args.category)
      searchArgs.filters = [{ name: 'category', value: args.category }];

    const results = await rag.search(ctx, searchArgs);
    console.log(results);
    return results.results;
  },
});
