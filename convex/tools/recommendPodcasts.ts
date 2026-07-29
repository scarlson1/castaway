import { createTool } from '@convex-dev/agent';
import { internal } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { isNotNullish } from 'convex/utils/helpers';
import z from 'zod';

// Why native ctx.vectorSearch here: Podcasts are in a Convex native vector index (podcasts.by_embedding), not RAG. This requires ctx.vectorSearch('podcasts', 'by_embedding', { vector, limit }) — the standard Convex vector search API, not rag.search.

let BASE_DOMAIN = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.CLIENT_BASE_URL || 'http://localhost:3000';

export const recommendPodcasts = createTool({
  description:
    "Recommend new podcasts to follow based on the user's listening history and current subscriptions.",
  args: z.object({
    excludeSubscribed: z
      .boolean()
      .optional()
      .describe(
        'If true, exclude podcasts the user already follows. Default true.',
      ),
    limit: z.number().optional(),
  }),
  handler: async (ctx, { excludeSubscribed = true, limit = 5 }) => {
    const userId = ctx.userId;
    if (!userId) return 'Must be logged in to use `recommendEpisodes` tool.';

    const user = await ctx.runQuery(internal.users.getUser, {
      clerkId: userId,
    });
    // fallback on most listened ??
    if (!user?.interestEmbedding)
      return 'no listening history available for user.';

    const results = await ctx.vectorSearch('podcasts', 'by_embedding', {
      vector: user.interestEmbedding,
      limit: limit + 3,
    });
    console.log(JSON.stringify(results, null, 2));

    // If excludeSubscribed (default true): fetch subscriptions, filter post-search
    // if (excludeSubscribed) {
    //     const podcasts: (Doc<'podcasts'> | null)[] = await ctx.runQuery(
    //         internal.podcasts.getEmbResults,
    //         { ids: results.map((r) => r._id) }
    //       );

    //     return podcasts.filter(isNotNullish).slice(0, limit);
    // }

    const podcasts: (Doc<'podcasts'> | null)[] = await ctx.runQuery(
      internal.podcasts.getEmbResults,
      { ids: results.slice(0, limit).map((r) => r._id) },
    );

    return podcasts.filter(isNotNullish).map((p) => ({
      title: p.title,
      author: p.author,
      imageUrl: p.imageUrl,
      description: p.description,
      link: p.podcastId ? `${BASE_DOMAIN}/podcasts/${p.podcastId}` : null,
    }));
  },
});
