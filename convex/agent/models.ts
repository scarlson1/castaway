import { openai } from '@ai-sdk/openai';
import { mockModel } from '@convex-dev/agent';
// import type { EmbeddingModel } from "openai/resources/embeddings.mjs";

let languageModel; // : LanguageModelV2;
let textEmbeddingModel; // : EmbeddingModel<string>;
let embeddingDimension = 1536;

// if (process.env.ANTHROPIC_API_KEY) {
//   languageModel = anthropic.chat("claude-opus-4-20250514");
// } else if (process.env.OPENAI_API_KEY) {
if (process.env.OPENAI_API_KEY) {
  languageModel = openai.chat('gpt-4o-mini');
  textEmbeddingModel = openai.textEmbeddingModel('text-embedding-3-small');
  embeddingDimension = 1536;
  // } else if (process.env.GROQ_API_KEY) {
  //   languageModel = groq.languageModel(
  //     "meta-llama/llama-4-scout-17b-16e-instruct",
  //   );
  // } else if (process.env.OPENROUTER_API_KEY) {
  //   languageModel = openrouter.chat("openai/gpt-4o-mini") as LanguageModelV2;
} else {
  languageModel = mockModel({});
  console.warn(
    'Run `npx convex env set GROQ_API_KEY=<your-api-key>` or `npx convex env set OPENAI_API_KEY=<your-api-key>` or `npx convex env set OPENROUTER_API_KEY=<your-api-key>` from the example directory to set the API key.'
  );
}

// If you want to use different models for examples, you can change them here.
export { embeddingDimension, languageModel, textEmbeddingModel };
