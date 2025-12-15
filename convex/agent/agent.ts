import { Agent } from '@convex-dev/agent';
import { components } from 'convex/_generated/api';
import { languageModel, textEmbeddingModel } from 'convex/agent/models';
import { searchEpisodes } from 'convex/tools/searchEpisodes';
import { updateThreadTitle } from 'convex/tools/updateThreadTitle';

export const agent = new Agent(components.agent, {
  name: 'chat-agent',
  languageModel: languageModel,
  // languageModel: components.languageModels.openaiChat({
  //   model: "gpt-4o-mini",
  // }),
  instructions: `You are a helpful assistant. Be concise and friendly in your responses. When the user begins a new topic of conversation, call the "updateThreadTitle" tool to set a concise and meaningful title.`,
  textEmbeddingModel, // openai.embedding(textEmbeddingModel),
  tools: {
    updateThreadTitle,
    searchEpisodes,
  },
  // stopWhen?: StopCondition<any> | StopCondition<any>[] | undefined;
  maxSteps: 10,
});
