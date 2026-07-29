# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Castaway — a podcast app with AI transcription, ad detection/skipping, RAG chat, and vector-based recommendations. TanStack Start (React 19, SSR via Nitro → Vercel) frontend + Convex backend + Clerk auth + MUI v9 + OpenAI.

`docs/DEVELOPMENT.md` is the reference for env vars, table shapes, and the ad-detection / RAG flows. `docs/DEPLOYMENT.md` covers Vercel + Convex prod env. Keep both in sync when changing schema or pipelines.

## Commands

```bash
pnpm install
pnpm dev          # convex codegen once, then vite dev (:3000) + `convex dev` in parallel
pnpm dev:local    # same, against a local Convex backend
pnpm dev:webhook  # ngrok tunnel so Clerk webhooks reach convex/http.ts
pnpm test         # vitest run
pnpm build
```

Single test file / single case:

```bash
pnpm vitest run convex/__tests__/playback.test.ts -t 'returns the playback record'
```

There is no lint or format script. `npx tsc --noEmit -p tsconfig.json` typechecks the frontend and is currently clean — keep it that way. MUI v9 dropped system props on `Typography` (`fontWeight`, `width`, `fontSize`, …), so those belong in `sx`.

CI (`.github/workflows/test.yml`) runs `pnpm test` on PRs to `main` that touch `convex/**`. Merging to `main` deploys to Vercel.

## Module resolution

Two path aliases, applied on both sides via `vite-tsconfig-paths`:

- `~/*` → `src/*` (root `tsconfig.json`)
- `convex/*` → `convex/*` (`convex/tsconfig.json`)

Convex files import each other with the **absolute** `convex/...` specifier (`import { getClerkId } from 'convex/utils/auth'`), not relative paths. This works because the alias falls back to `node_modules` for real package subpaths, so `convex/server`, `convex/values`, and `convex/react` still resolve to the npm package. Frontend code imports generated types the same way: `import { api } from 'convex/_generated/api'`.

`convex/__tests__` is excluded from `convex/tsconfig.json`; `vitest.config.ts` loads both tsconfigs explicitly so tests resolve the aliases.

## Architecture

### Three data sources

1. **Convex DB** — everything a user has subscribed to: podcasts, episodes, playback, transcripts, ads, chat. Read reactively from components.
2. **Podcast Index API** — discovery/trending/search for content not yet in the DB. Called only from TanStack server functions (`src/serverFn/*.ts`, `createServerFn().inputValidator(zodSchema).handler(...)`) using the client in `src/lib/podcastIndexClient.ts`. Each is wrapped as a `queryOptions` factory in [src/queries.ts](src/queries.ts).
3. **OpenAI** — transcription, summarization, ad classification, embeddings, chat agent. Only from Convex actions.

Subscribing is the boundary: an unsubscribed podcast lives only in Podcast Index responses; `convex/actions.ts → subscribe` copies it into `podcasts` + `episodes` and everything downstream keys off the DB.

### Client data fetching

Components fetch with `useSuspenseQuery(convexQuery(api.x.y, args))`, wrapped in `<Suspense>` + `<ErrorBoundary>` (skeletons live in `src/components/suspense/`). Route `loader`s call `queryClient.prefetchQuery(...)` **without awaiting** so navigation isn't blocked. `src/router.tsx` wires `ConvexQueryClient` into the TanStack Query client (5 min default `staleTime`) and enables SSR query integration.

### Auth

Clerk everywhere; there is no separate session layer.

- `src/start.ts` installs `clerkMiddleware()` as request middleware.
- `__root.tsx` `beforeLoad` calls `getCachedClerkAuth()` (5-min in-process token cache in `src/serverFn/auth.ts`) and pushes the Convex-template JWT into `convexQueryClient.serverHttpClient` so SSR queries are authenticated; the client side is handled by `ConvexProviderWithClerk`.
- Protected pages live under the `_authed` layout route, which redirects to `/auth/signin`.
- In Convex, identity comes from `getClerkId(ctx.auth)` / `getClerkIdIfExists(ctx.auth)` (`convex/utils/auth.ts`). **Rows are keyed by `clerkId` strings, not by a Convex `users` document id.** The `users` table is a mirror synced by the Clerk webhook (`convex/http.ts` → `convex/clerk.ts`).

### ID conventions (easy to get wrong)

Most Convex tables reference podcasts and episodes by **feed GUID strings** (`podcastId`, `episodeId`), not `Id<'podcasts'>` / `Id<'episodes'>`. Where an actual document id is needed alongside, it gets an explicit name (`convexEpId`, `podConvexId`). Queries go through indexes named `by_<field>...` (e.g. `by_podId_pub`, `by_adId_clerkId`).

### Convex runtimes

Only `convex/node.ts` and `convex/adPipeline/classifyWindows.ts` declare `'use node'` (OpenAI SDK, audio chunking). Everything else runs in the default Convex runtime — `fetch` is available there, so don't add `'use node'` just to make an HTTP call. Mutations cannot call external APIs; the pattern used throughout is to insert first, then `ctx.scheduler.runAfter(0, internalAction, ...)` to fill in the embedding (see `addManualAdSegment` → `fillAdEmbedding`).

### Components registered in `convex/convex.config.ts`

`agent`, `rag`, `workflow`, `migrations`, and two `aggregate` instances (`aggregateByEpisode`, `aggregateByPodcast`, used by `convex/stats/` for "most played" queries).

### Pipelines

`convex/transcriptWorkflow.ts` (transcribe → summarize → index into RAG) and `convex/adPipeline/` (job row → transcript workflow → chunk transcript into overlapping windows → LLM classify → merge into ad segments → embed + save).

Two Convex limits shape this code, and any new pipeline work should respect them:

- Actions time out at 600s, so long work is **recursively self-scheduled** — `classifyWindows` processes one batch (20 windows), reschedules itself, and calls `workflow.sendEvent` when the last batch lands; the workflow waits on that event rather than on one long action.
- Workflow steps can pass at most 1 MiB total, so steps exchange ids (`jobId`, `transcriptId`) and read the payload from the DB.

Ad accuracy improves per-podcast from user feedback: quorum voting on `adFeedback` sets a verdict, which recalibrates a per-podcast confidence threshold in `podcastAdConfig` (consumed by `mergeSegments.ts`), and recent labeled examples are injected as few-shot examples into the classifier prompt. Details in `docs/DEVELOPMENT.md`.

### Audio playback (client)

State lives in zustand stores, not React context: `useAudioStore` (position/rate/volume, persisted to a per-episode `localStorage` key), `useQueueStore` (`nowPlaying`, drawer state), `usePlayerSettings` (e.g. auto-skip).

**The `Howl` instance is a ref inside `useAudioPlayer`, so that hook must be called exactly once** — currently only by `src/components/AudioPlayer/index.tsx`, which is mounted once in `__root.tsx`. Calling it from a second component creates a duplicate `Howl` and audible echo. Other components read state from `useAudioStore` and seek through the callback the player registers via `registerSeek`.

`useAutoSkip` compares the current position against `adSegments` for the episode and seeks past ads.

### Theming

MUI v9 with CSS variables (`cssVarPrefix: ''`, `colorSchemeSelector: 'data'`) in `src/theme/`. Clerk components are themed by mapping `var(--palette-*)` into `<ClerkProvider appearance>` in `__root.tsx`, so palette changes must go through `themePrimitives.ts` to stay consistent. Layout offsets are shared as CSS custom properties (`--Castaway-header-height`, `--Castaway-bottom-nav-height`, `--Castaway-audio-player-height`).

## Environment

Client-visible vars are gated by `envPrefix: ['CLERK_SIGN_IN_', 'CLERK_SIGN_UP_', 'VITE_']` in `vite.config.ts` and validated at startup by `src/utils/env.validation.ts` (zod over `import.meta.env`) — add new client vars to that schema or the app throws on boot. Server-side secrets (OpenAI, Podcast Index, Clerk webhook) belong in the **Convex** dashboard, not in `.env*`; see `docs/DEVELOPMENT.md`.

## Tests

`vitest` (node environment) over `convex/__tests__/**` and `src/**/__tests__/**` only. Convex tests use `convex-test`:

```ts
const modules = import.meta.glob('../**/*.*s');
const t = convexTest(schema, modules);
await t.withIdentity({ subject: 'clerk_user_1' }).query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });
```

`withIdentity({ subject })` is how `getClerkId` sees a signed-in user.

## Conventions

- Single quotes, arrow-function components/hooks, `interface` over `type` for object shapes.
- Convex functions use the object form (`query({ args, handler })`) with `v.*` validators; internal-only entry points use `internalQuery`/`internalMutation`/`internalAction`.
- `.cursor/rules/convex_rules.mdc` holds the full Convex style guide; the TanStack Router rule files there are upstream docs copies.
- The codebase carries a lot of commented-out alternatives and `TODO:`/`DELETE ??` notes — treat them as history, and don't revive one without checking why it was replaced.
