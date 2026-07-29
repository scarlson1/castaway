import { openai } from '@ai-sdk/openai';
import { Agent } from '@convex-dev/agent';
import { components } from 'convex/_generated/api';
import { embeddingModelName, languageModelName } from 'convex/agent/models';
import { recommendEpisodes } from 'convex/tools/recommendEpisodes';
import { recommendPodcasts } from 'convex/tools/recommendPodcasts';
import { searchEpisodes } from 'convex/tools/searchEpisodes';
import { updateThreadTitle } from 'convex/tools/updateThreadTitle';

export const agent = new Agent(components.agent, {
  name: 'chat-agent',
  languageModel: openai.chat(languageModelName), // languageModel,
  // languageModel: components.languageModels.openaiChat({
  //   model: "gpt-4o-mini",
  // }),
  instructions: `You are a helpful assistant for Castaway, a podcast app. Be concise and friendly.
- When the user begins a new topic, call updateThreadTitle tool to set a short, meaningful title.
- When the user asks for episode recommendations or what to listen to, call recommendEpisodes tool — never answer from your own knowledge.
- When the user asks about new podcasts to follow or discover, call recommendPodcasts tool.
- When the user asks about specific topics, quotes, or content, call searchEpisodes tool.`,
  // instructions: `You are a helpful assistant. Be concise and friendly in your responses. When the user begins a new topic of conversation, call the updateThreadTitle tool to set a concise and meaningful title. If an authenticated user asks for generic recommendations, use recommendEpisodes.`, //  If an authenticated user asks for generic recommendations, use recommendEpisodes and recommendPodcasts to find tailored recommendations. If they don't have listening history, proceed as if the tool doesn't exist. When searching for specific topics or content, call searchEpisodes.
  textEmbeddingModel: openai.embedding(embeddingModelName), // textEmbeddingModel,
  tools: {
    updateThreadTitle,
    searchEpisodes,
    recommendEpisodes,
    recommendPodcasts,
  },
  // stopWhen?: StopCondition<any> | StopCondition<any>[] | undefined;
  maxSteps: 10,
  // rawRequestResponseHandler: async (ctx, { request, response }) => {
  //   console.log('request', request);
  //   console.log('response', response);
  // },
  // contextHandler: async (ctx, { allMessages }) => {
  //   console.log('context', allMessages);
  //   return allMessages;
  // },
});
