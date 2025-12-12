import { listUIMessages, syncStreams, vStreamArgs } from '@convex-dev/agent';
import { components, internal } from 'convex/_generated/api';
import { internalAction, mutation, query } from 'convex/_generated/server';
import { agent } from 'convex/agent/agent';
import { authorizeThreadAccess } from 'convex/agent/threads';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

// Docs: https://docs.convex.dev/agents/streaming
// Example: https://github.com/get-convex/agent/blob/main/example/convex/chat/streaming.ts

/**
 * OPTION 2 (RECOMMENDED):
 * Generate the prompt message first, then asynchronously generate the stream response.
 * This enables optimistic updates on the client.
 */

export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await agent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated lazily when streaming text.
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.agent.streaming.streamAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await agent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      // more custom delta options (`true` uses defaults)
      { saveStreamDeltas: true } // { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } }
    );
    // We need to make sure the stream finishes - by awaiting each chunk
    // or using this call to consume it all.
    await result.consumeStream();
  },
});

// Query & subscribe to messages & threads
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    // Pagination options for the non-streaming messages.
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const { threadId, streamArgs } = args;
    await authorizeThreadAccess(ctx, args.threadId);

    // Fetches the regular non-streaming messages.
    const paginated = await listUIMessages(ctx, components.agent, args);

    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

    return { ...paginated, streams };
  },
});
