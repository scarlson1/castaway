/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as adFeedback from "../adFeedback.js";
import type * as adJobs from "../adJobs.js";
import type * as adPipeline_chunkTranscript from "../adPipeline/chunkTranscript.js";
import type * as adPipeline_classifyWindows from "../adPipeline/classifyWindows.js";
import type * as adPipeline_mergeSegments from "../adPipeline/mergeSegments.js";
import type * as adPipeline_saveToAds from "../adPipeline/saveToAds.js";
import type * as adPipeline_start from "../adPipeline/start.js";
import type * as adPipeline_transcribe from "../adPipeline/transcribe.js";
import type * as adPipeline_workflow from "../adPipeline/workflow.js";
import type * as adSegments from "../adSegments.js";
import type * as agent_agent from "../agent/agent.js";
import type * as agent_chat from "../agent/chat.js";
import type * as agent_models from "../agent/models.js";
import type * as agent_streaming from "../agent/streaming.js";
import type * as agent_threads from "../agent/threads.js";
import type * as agent_usage from "../agent/usage.js";
import type * as aggregates from "../aggregates.js";
import type * as clerk from "../clerk.js";
import type * as crons from "../crons.js";
import type * as episodeEmbeddings from "../episodeEmbeddings.js";
import type * as episodes from "../episodes.js";
import type * as http from "../http.js";
import type * as node from "../node.js";
import type * as playback from "../playback.js";
import type * as podcasts from "../podcasts.js";
import type * as rag from "../rag.js";
import type * as stats_episodes from "../stats/episodes.js";
import type * as stats_podcasts from "../stats/podcasts.js";
import type * as subscribe from "../subscribe.js";
import type * as tools_recommendEpisodes from "../tools/recommendEpisodes.js";
import type * as tools_recommendPodcasts from "../tools/recommendPodcasts.js";
import type * as tools_searchEpisodes from "../tools/searchEpisodes.js";
import type * as tools_updateThreadTitle from "../tools/updateThreadTitle.js";
import type * as transcriptWorkflow from "../transcriptWorkflow.js";
import type * as transcripts from "../transcripts.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_buildWindows from "../utils/buildWindows.js";
import type * as utils_embeddings from "../utils/embeddings.js";
import type * as utils_env from "../utils/env.js";
import type * as utils_helpers from "../utils/helpers.js";
import type * as utils_llmBatchClassifier from "../utils/llmBatchClassifier.js";
import type * as utils_mergeWindows from "../utils/mergeWindows.js";
import type * as utils_summarizeTranscript from "../utils/summarizeTranscript.js";
import type * as utils_transcribeUrl from "../utils/transcribeUrl.js";
import type * as utils_types from "../utils/types.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  adFeedback: typeof adFeedback;
  adJobs: typeof adJobs;
  "adPipeline/chunkTranscript": typeof adPipeline_chunkTranscript;
  "adPipeline/classifyWindows": typeof adPipeline_classifyWindows;
  "adPipeline/mergeSegments": typeof adPipeline_mergeSegments;
  "adPipeline/saveToAds": typeof adPipeline_saveToAds;
  "adPipeline/start": typeof adPipeline_start;
  "adPipeline/transcribe": typeof adPipeline_transcribe;
  "adPipeline/workflow": typeof adPipeline_workflow;
  adSegments: typeof adSegments;
  "agent/agent": typeof agent_agent;
  "agent/chat": typeof agent_chat;
  "agent/models": typeof agent_models;
  "agent/streaming": typeof agent_streaming;
  "agent/threads": typeof agent_threads;
  "agent/usage": typeof agent_usage;
  aggregates: typeof aggregates;
  clerk: typeof clerk;
  crons: typeof crons;
  episodeEmbeddings: typeof episodeEmbeddings;
  episodes: typeof episodes;
  http: typeof http;
  node: typeof node;
  playback: typeof playback;
  podcasts: typeof podcasts;
  rag: typeof rag;
  "stats/episodes": typeof stats_episodes;
  "stats/podcasts": typeof stats_podcasts;
  subscribe: typeof subscribe;
  "tools/recommendEpisodes": typeof tools_recommendEpisodes;
  "tools/recommendPodcasts": typeof tools_recommendPodcasts;
  "tools/searchEpisodes": typeof tools_searchEpisodes;
  "tools/updateThreadTitle": typeof tools_updateThreadTitle;
  transcriptWorkflow: typeof transcriptWorkflow;
  transcripts: typeof transcripts;
  users: typeof users;
  "utils/auth": typeof utils_auth;
  "utils/buildWindows": typeof utils_buildWindows;
  "utils/embeddings": typeof utils_embeddings;
  "utils/env": typeof utils_env;
  "utils/helpers": typeof utils_helpers;
  "utils/llmBatchClassifier": typeof utils_llmBatchClassifier;
  "utils/mergeWindows": typeof utils_mergeWindows;
  "utils/summarizeTranscript": typeof utils_summarizeTranscript;
  "utils/transcribeUrl": typeof utils_transcribeUrl;
  "utils/types": typeof utils_types;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  aggregateByEpisode: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateByEpisode">;
  aggregateByPodcast: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateByPodcast">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
