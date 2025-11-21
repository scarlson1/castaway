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
import type * as adJobs from "../adJobs.js";
import type * as adPipeline_chunkTranscript from "../adPipeline/chunkTranscript.js";
import type * as adPipeline_classifyWindows from "../adPipeline/classifyWindows.js";
import type * as adPipeline_fetchAudio from "../adPipeline/fetchAudio.js";
import type * as adPipeline_mergeSegments from "../adPipeline/mergeSegments.js";
import type * as adPipeline_saveToAds from "../adPipeline/saveToAds.js";
import type * as adPipeline_start from "../adPipeline/start.js";
import type * as adPipeline_transcribe from "../adPipeline/transcribe.js";
import type * as adSegments from "../adSegments.js";
import type * as clerk from "../clerk.js";
import type * as crons from "../crons.js";
import type * as episodes from "../episodes.js";
import type * as http from "../http.js";
import type * as node from "../node.js";
import type * as playback from "../playback.js";
import type * as podcasts from "../podcasts.js";
import type * as subscribe from "../subscribe.js";
import type * as users from "../users.js";
import type * as utils_buildWindows from "../utils/buildWindows.js";
import type * as utils_embeddings from "../utils/embeddings.js";
import type * as utils_llmBatchClassifier from "../utils/llmBatchClassifier.js";
import type * as utils_mergeWindows from "../utils/mergeWindows.js";
import type * as utils_transcribeUrl from "../utils/transcribeUrl.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  adJobs: typeof adJobs;
  "adPipeline/chunkTranscript": typeof adPipeline_chunkTranscript;
  "adPipeline/classifyWindows": typeof adPipeline_classifyWindows;
  "adPipeline/fetchAudio": typeof adPipeline_fetchAudio;
  "adPipeline/mergeSegments": typeof adPipeline_mergeSegments;
  "adPipeline/saveToAds": typeof adPipeline_saveToAds;
  "adPipeline/start": typeof adPipeline_start;
  "adPipeline/transcribe": typeof adPipeline_transcribe;
  adSegments: typeof adSegments;
  clerk: typeof clerk;
  crons: typeof crons;
  episodes: typeof episodes;
  http: typeof http;
  node: typeof node;
  playback: typeof playback;
  podcasts: typeof podcasts;
  subscribe: typeof subscribe;
  users: typeof users;
  "utils/buildWindows": typeof utils_buildWindows;
  "utils/embeddings": typeof utils_embeddings;
  "utils/llmBatchClassifier": typeof utils_llmBatchClassifier;
  "utils/mergeWindows": typeof utils_mergeWindows;
  "utils/transcribeUrl": typeof utils_transcribeUrl;
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

export declare const components: {};
