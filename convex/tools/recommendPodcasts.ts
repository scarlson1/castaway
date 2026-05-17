import { createTool } from '@convex-dev/agent';
import z from 'zod';

// Why native ctx.vectorSearch here: Podcasts are in a Convex native vector index (podcasts.by_embedding), not RAG. This requires ctx.vectorSearch('podcasts', 'by_embedding', { vector, limit }) — the standard Convex vector search API, not rag.search.

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
  handler: async (ctx, args) => {
    // 1. Get interestEmbedding from user doc (same as episodes)
    // 2. ctx.vectorSearch('podcasts', 'by_embedding', {
    //      vector: user.interestEmbedding,
    //      limit: args.limit ?? 8,
    //    })
    // 3. If excludeSubscribed (default true): fetch subscriptions, filter post-search
    // 4. Return podcast title, description, link, image
  },
});
