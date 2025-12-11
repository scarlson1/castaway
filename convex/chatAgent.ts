// 'use node'

import { Agent } from '@convex-dev/agent';
import { components } from 'convex/_generated/api';
import { action, mutation, query } from 'convex/_generated/server';
import { textEmbeddingModel } from 'convex/rag';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatAgent = new Agent(components.agent, {
  name: 'chat-agent',
  languageModel: 'openai/gpt-4o-mini',
  instructions:
    'You are a helpful assistant. Be concise and friendly in your responses',
  textEmbeddingModel: textEmbeddingModel,
  // tools: {
  //   testConvexTool: createTool({
  //     description: 'search episode content',
  //     args: z.object({}),
  //     handler: async (ctx, args): Promise<string> => {
  //       return 'hello world';
  //     },
  //   }),
  // },
  // stopWhen?: StopCondition<any> | StopCondition<any>[] | undefined;
  maxSteps: 10,
});

export const createThread = mutation({
  args: {},
  handler: async (ctx) => {
    // const clerkId = await getClerkIdIfExists(ctx.auth);
    const { threadId } = await chatAgent.createThread(ctx, {
      // userId: clerkId,
    });

    return { threadId };
  },
});

export const sendMessageToAgent = action({
  args: { threadId: v.string(), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    // const userId = await getClerkIdIfExists(ctx.auth);
    const { thread } = await chatAgent.continueThread(ctx, {
      threadId,
      // userId,
    });

    const result = await thread.generateText({ prompt });
    return result.text;
  },
});

export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { threadId, paginationOpts }) => {
    return await chatAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
      excludeToolMessages: true,
    });
  },
});
