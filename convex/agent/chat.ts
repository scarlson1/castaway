import { listMessages } from '@convex-dev/agent';
import { components } from 'convex/_generated/api';
import { action, query } from 'convex/_generated/server';
import { agent } from 'convex/agent/agent';
import { authorizeThreadAccess } from 'convex/agent/threads';
import { paginationOptsValidator } from 'convex/server';
import { getClerkIdIfExists } from 'convex/utils/auth';
import { v } from 'convex/values';

export const sendMessageToAgent = action({
  args: { threadId: v.string(), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const userId = await getClerkIdIfExists(ctx.auth);
    const { thread } = await agent.continueThread(ctx, {
      threadId,
      userId,
    });

    const result = await thread.generateText({ prompt });
    return result.text;
  },
});

export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { threadId, paginationOpts }) => {
    await authorizeThreadAccess(ctx, threadId);
    // return await chatAgent.listMessages(ctx, {
    //   threadId,
    //   paginationOpts,
    //   excludeToolMessages: true,
    // });
    // const paginated = await listUIMessages(ctx, components.agent, {
    //   threadId,
    //   paginationOpts,
    // });
    // // Here you could filter out / modify the documents
    // return paginated;
    const messages = await listMessages(ctx, components.agent, {
      threadId,
      paginationOpts,
    });
    // You could add more fields here, join with other tables, etc.
    return messages;
  },
});
