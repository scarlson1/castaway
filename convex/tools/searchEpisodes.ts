import { createTool } from '@convex-dev/agent';
import type { SearchResult } from '@convex-dev/rag';
import { defaultNamespace, rag } from 'convex/rag';
import z from 'zod';

type EpisodeSearchResult = SearchResult & {
  link?: string;
  podcastId?: string | null;
  episodeId?: string | null;
};

export const searchEpisodes = createTool({
  description:
    'search podcast episodes. The link is a partial URL from the current domain.',
  args: z.object({
    query: z.string().describe("describe the context you're looking for"),
    category: z.string().describe('optionally filter by category').optional(),
  }),
  handler: async (ctx, args): Promise<EpisodeSearchResult[]> => {
    // SearchResult
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
    console.log(JSON.stringify(results, null, 2));

    let BASE_DOMAIN = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.CLIENT_BASE_URL || 'http://localhost:3000';

    // return results.results;
    return results.results.map((result, index) => {
      const entry = results.entries[index];
      const { podcastId, episodeId } = entry?.metadata ?? {};

      return {
        ...result,
        podcastId,
        episodeId,
        link:
          podcastId && episodeId && BASE_DOMAIN
            ? `${BASE_DOMAIN}/podcasts/${podcastId}/episodes/${episodeId}`
            : undefined,
      };
    });
  },
});

// return results.results
// .filter(
//   (r) => r.metadata.podcastId && r.metadata.episodeId
// )
// .map((r) => ({
//   score: r.score,
//   podcastId: r.metadata.podcastId,
//   episodeId: r.metadata.episodeId!,
//   episodeTitle: r.metadata.episodeTitle ?? null,
//   link: `/podcasts/${r.metadata.podcastId}/episode/${r.metadata.episodeId}`,
// }));
