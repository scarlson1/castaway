import { openai } from '@ai-sdk/openai';
import { Agent } from '@convex-dev/agent';
import { components } from 'convex/_generated/api';
import { textEmbeddingModel } from 'convex/rag';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const agent = new Agent(components.agent, {
  name: 'chat-agent',
  languageModel: openai.chat('gpt-4o-mini'), // 'openai/gpt-4o-mini',
  instructions:
    'You are a helpful assistant. Be concise and friendly in your responses',
  textEmbeddingModel: openai.embedding(textEmbeddingModel), // textEmbeddingModel,
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
