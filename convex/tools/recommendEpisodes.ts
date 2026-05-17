import { createTool } from '@convex-dev/agent';
import { internal } from 'convex/_generated/api';
import { defaultNamespace, rag } from 'convex/rag';
import z from 'zod';

let BASE_DOMAIN = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.CLIENT_BASE_URL || 'http://localhost:3000';

//  from the user's library
export const recommendEpisodes = createTool({
  description:
    "Recommend episodes based on their listening history. No args needed — uses the user's taste profile automatically.",
  args: z.object({
    excludeListened: z
      .boolean()
      .optional()
      .describe('If true, exclude episodes the user has already played'),
    limit: z
      .number()
      .optional()
      .describe('Number of recommendations, default 5'),
  }),
  handler: async (ctx, { excludeListened = true, limit = 5 }) => {
    const userId = ctx.userId;
    if (!userId) return 'Must be logged in to use `recommendEpisodes` tool.';

    const user = await ctx.runQuery(internal.users.getUser, {
      clerkId: userId,
    });
    if (!user?.interestEmbedding)
      return 'no listening history available for user.';

    const results = await rag.search(ctx, {
      namespace: defaultNamespace,
      query: user.interestEmbedding,
      limit: limit + 3,
    });
    console.log(JSON.stringify(results, null, 2));

    // TODO: get user's listen history and filter out already listened
    // if (excludeListened) {

    // }

    return results.results.map((r, i) => {
      const entry = results.entries[i];
      const { podcastId, episodeId } = entry?.metadata ?? {};

      return {
        ...r,
        // x: entry.
        podcastId,
        episodeId,
        link:
          podcastId && episodeId && BASE_DOMAIN
            ? `${BASE_DOMAIN}/podcasts/${podcastId}/episodes/${episodeId}`
            : undefined,
      };
    });

    // 1. Get userId from ctx.userId (ToolCtx.userId = Clerk ID, set in continueThread)
    // 2. ctx.runQuery(internal.users.getUser, { clerkId: ctx.userId }) → user doc
    // 3. If no interestEmbedding → return "no listening history yet" message
    // 4. rag.search(ctx, { namespace: defaultNamespace, query: user.interestEmbedding, limit: args.limit ?? 8 })
    //    — passing the number[] vector directly avoids an embedding API call
    // 5. If excludeListened: fetch user_playback episodeIds, filter results post-search
    //    (Convex vector search has no exclusion filter, must over-fetch + filter)
    // 6. Map results same as searchEpisodes (attach link, podcastId, episodeId from metadata)
    // 7. Return top N
  },
});
