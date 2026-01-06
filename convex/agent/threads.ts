import { getThreadMetadata, saveMessage, vMessage } from '@convex-dev/agent';
import { components } from 'convex/_generated/api';
import {
  action,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from 'convex/_generated/server';
import { agent } from 'convex/agent/agent';
import { paginationOptsValidator } from 'convex/server';
import { getClerkId, getClerkIdIfExists } from 'convex/utils/auth';
import { v } from 'convex/values';
import z from 'zod';

export const create = mutation({
  args: { title: v.optional(v.string()), initialMessage: v.optional(vMessage) },
  handler: async (ctx, { title = 'New chat', initialMessage }) => {
    const clerkId = await getClerkIdIfExists(ctx.auth);
    const { threadId } = await agent.createThread(ctx, {
      userId: clerkId,
      title,
    });

    if (initialMessage) {
      await saveMessage(ctx, components.agent, {
        threadId,
        message: initialMessage,
      });
      // const { thread } = await agent.continueThread(ctx, {
      //   threadId,
      //   userId: clerkId,
      // });
      // const result = await thread.generateText({ prompt });
    }

    return { threadId };
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getClerkId(ctx.auth);
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId, paginationOpts: args.paginationOpts }
    );
    return threads;
  },
});

export const details = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { title, summary } = await getThreadMetadata(ctx, components.agent, {
      threadId,
    });
    return { title, summary };
  },
});

export const updateTitle = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await agent.continueThread(ctx, { threadId });
    const {
      object: { title, summary },
    } = await thread.generateObject(
      {
        // mode: "json",
        schemaDescription:
          "Generate a title and summary for the thread. The title should be a single sentence that captures the main topic of the thread. The summary should be a short description of the thread that could be used to describe it to someone who hasn't read it. Try to keep the title length under 6 words.",
        schema: z.object({
          title: z.string().describe('The new title for the thread'),
          summary: z.string().describe('The new summary for the thread'),
        }),
        prompt: 'Generate a title and summary for this thread.',
      },
      { storageOptions: { saveMessages: 'none' } }
    );
    await thread.updateMetadata({ title, summary });
  },
});

export const overrideTitle = action({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await agent.continueThread(ctx, { threadId });

    await thread.updateMetadata({ title });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId, true);
    // const result = await deleteAllForThreadIdAsync(ctx, { threadId })
    await agent.deleteThreadAsync(ctx, { threadId });
  },
});

export async function authorizeThreadAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  threadId: string,
  requireUser?: boolean
) {
  const userId = await getClerkId(ctx.auth);
  if (requireUser && !userId) throw new Error('Unauthorized: user is required');

  const { userId: threadUserId } = await getThreadMetadata(
    ctx,
    components.agent,
    { threadId }
  );
  if (requireUser && threadUserId !== userId)
    throw new Error('Unauthorized: user does not match thread user');
}
