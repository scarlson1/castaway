# Castaway Podcast App

---

## Directory Structure

TODO

## Development

Add `PODCAST_INDEX_KEY` and `PODCAST_INDEX_SECRET` to .env.local file within the rood directory.

## Features

- subscribe
- queue
- trending / discovery
- notifications

## TODO

- database
- optimized caching
- subscription notifications
- auto-skip ads
- search
- vector search to find similar podcasts (combine with metadata (category, people, etc.) to produce score) ??

## Subscription flow

### Collections / tables

- `podcasts` - canonical podcast metadata
  ```json
  {
    "_id": "podcast:xxxxx",
    "feedUrl": "https://feeds.example.com/show.xml", // canonical feed URL
    "title": "Show Title",
    "description": "short blurb",
    "imageUrl": "https://...",
    "itunesId": 12345, // if available
    "lastFetchedAt": 1699999999 // unix epoch ms
  }
  ```
- `episodes` - canonical episode references (one doc per episode GUID)
  ```json
  {
    "_id": "episode:yyyy",
    "podcastId": "podcast:xxxxx",
    "guid": "<episode-guid-from-feed>",
    "title": "Episode Title",
    "publishedAt": 1699999999,
    "audioUrl": "https://cdn...",
    "durationSeconds": 3600,
    "sizeBytes": 12345678,
    "summary": "...",
    "enclosureType": "audio/mpeg",
    "retrievedAt": 1699999999
  }
  ```
- `subscriptions` - user subscribes to a podcast
  ```json
  {
    "_id": "subscription:zzz",
    "userId": "user:abc",
    "podcastId": "podcast:xxxxx",
    "subscribedAt": 1699999999,
    "settings": {
      "autoDownload": false,
      "notificationNew": true,
      "sort": "newest"
    }
  }
  ```
- `user_playback` - per (user, episode) progress & state
  ```json
  {
    "_id": "play:user:abc:episode:yyyy", // or fields userId + episodeId as keys
    "userId": "user:abc",
    "episodeId": "episode:yyyy",
    "positionSeconds": 120.5,
    "completed": false,
    "lastUpdatedAt": 1699999999,
    "playedPercentage": 0.033 // optional redundant field for UI fast-read
  }
  ```
- `user_queues` - per-user queue (ordered list of items)
  - option A: queue as ordered list
    ```json
    {
      "_id": "queue:user:abc",
      "userId": "user:abc",
      "items": [
        { "episodeId": "episode:yyyy", "enqueuedAt": 1699999999, "id": "qi1" },
        { "episodeId": "episode:zzzz", "enqueuedAt": 1699999988, "id": "qi2" }
      ],
      "lastModifiedAt": 1699999999
    }
    ```
  - option B: queue as per-item documents (easier realtime & small updates)
    ```json
    {
      "_id": "queueItem:q1",
      "userId": "user:abc",
      "episodeId": "episode:yyyy",
      "positionIndex": 1000.0, // use float ordering technique
      "state": "queued" // queued|playing|played|removed
    }
    ```
  - recommend Option B for Convex (smaller write footprint and Convex realtime plays nicely with per-item updates).
- `user_devices` (optional) — register devices to push sync signals / presence:
  ```json
  {
    "_id": "device:dev1",
    "userId": "user:abc",
    "clientId": "web-xyz",
    "lastSeenAt": 1699999000
  }
  ```

### Subscribe flow

1. UI: user clicks “Subscribe” → client performs optimistic mutation: add a `subscription` doc in Convex via a mutation function (use TanStack Query mutate with onMutate to optimistically update UI).

2. Server: Convex mutation stores subscription and returns acknowledgement. Server (or external worker) triggers a feed fetch job: lookup the podcast by feedUrl in `podcasts`; if not present, create it and enqueue fetchFeed(podcastId) in your worker. The worker will call PodcastIndex to get feed/episode info and insert/merge episodes.

3. Worker: inserts/updates episodes with guid as idempotency key; then optionally notify users (push / notification flag) or update podcasts.lastFetchedAt.

Idempotency: worker should upsert by GUID/enclosure URL — PodcastIndex and feeds sometimes change GUIDs; use a composite of feedUrl + episode GUID + publishedAt for safe dedupe.

### Queue background work

Convex is realtime & has server functions but is not a job scheduler. Use a small worker system:

Worker responsibilities:

Poll PodcastIndex for updated feeds (or receive webhooks if available).

Fetch feeds and normalize to your episodes collection.

Perform heavier tasks: waveform extraction, generate transcriptions, download/cache audio for offline, generate audio snippets/previews.

Throttle requests and obey robots/remote limits.

Implementation options:

Simple cron + worker: schedule a cloud cron job that enqueues feed IDs to process (Cloud Run + Pub/Sub, AWS EventBridge + Lambda, etc.).

Job queue for retries: use a queue library (BullMQ, RabbitMQ, or cloud queue) to manage retry/exponential backoff for failing feed pulls.

Push model: when a user subscribes, enqueue immediate fetchFeed job for that podcastId.

Why separate worker? Feed parsing and waveform/transcription are IO/CPU heavy and you don’t want the browser or Convex mutation to block on them. Convex is excellent for realtime syncing but not for heavy batch processing; use workers for robustness.

### Storing playback, progress, played state & syncing rules

_Data & write patterns_

Persist `user_playback` per episode (position + lastUpdatedAt). Writes are small and idempotent. Use `lastUpdatedAt` server timestamp to resolve conflicts (last-write-wins), or attach a `deviceClock` + sequence if you want better merges.

Persist `user_queues` as per-item docs (see above) so reordering is cheap (update one or two docs). Use floating indices (1000, 2000, 1500) so reorders avoid rewriting all items. When indices get dense, rebalance in the background.

Mark an episode `completed` when `position >= duration * 0.95` (or when user presses “mark played”).

_Sync frontend_

Local immediate state: keep Howler play state (current Howl instance, `isPlaying`, `seek`) in ephemeral local state (React + a tiny store like Zustand or context). This is the real-time playback source of truth while the user is in the session.

Debounced persistence: every N seconds (e.g., 5–10s) while playing, write `user_playback.positionSeconds` to Convex (via TanStack Query mutation). Also write on pause/seek/stop and when the tab unloads. Debounce to coalesce writes; but write at least every 10s so progress is not lost. (If you want more robust offline, persist to IndexedDB then sync.)

Optimistic UI + TanStack Query: when the user seeks or marks completed, optimistically update the cached `user_playback/user_queues` using `onMutate` and rollback on error. Use `invalidateQueries/refetch` on settle if needed.
TanStack

Realtime mirroring via Convex: subscribe to `user_playback` and `user_queues` queries so changes from other devices (or background jobs) push to the client in realtime. When a remote update comes in while the user is actively playing locally, prefer the local ephemeral Howler state and only apply remote updates if `lastUpdatedAt` is newer than the local last persisted timestamp. This prevents remote writes from stomping live playback

_Example play sync flow_

User opens device A and plays episode X. Howler plays, UI updates locally. Every 5–10s you write position to Convex.

User opens device B: Convex realtime query returns the latest `user_playback.positionSeconds`; device B can show the “resume from X” affordance. If device B auto-play, check timestamps and ask user to resume instead of auto-overwriting.

If devices both play, last-write-wins on `lastUpdatedAt`. You can reduce race window by making device writes fast and infrequent.

---

### HowlerJS specifics & integration tips

- Create one Howl instance per playing audio (or reuse single Howl and swap `src` depending on complexity). Howler defaults to Web Audio and falls back to HTML5 audio; resume/seek behavior differs by mode — ensure `html5` is set appropriately for long streams vs. short sounds.

- To resume playback from saved position: create Howl, then call `howl.seek(savedPosition)` before h`owl.play()`. If you see restarts, make sure html5 flag and buffering choices are appropriate (some browsers need html5: true for large files). See common Howler usage notes for resume.

- Handle `onplay`, `onseek`, `onpause`, `onend` callbacks to trigger your persistence (debounced writes). On `onend`, mark `completed` and increment “played” counts server-side.

- Preload next episode’s small portion (or preconnect) for seamless gapless playback: create a Howl for next item with `preload: true` (but be cautious with mobile data).

### Queue order & conflict resolution

- Use per-item `positionIndex` floats (like 1000,2000...). Reordering is update of one or two items instead of rewriting whole queue. If many concurrent edits happen, normalize indices in background job.

- For strict ordering across devices, implement a tiny server-side sequencing function: when a client requests to move item to top, call a Convex mutation that sets `positionIndex = getSmallestIndex() - 1000` (atomic on server) so you avoid read-modify-write races. Convex mutations are atomic so they help here.

### Offline support

Persist in IndexedDB (e.g., localforage) the ephemeral queue + latest playback timestamp. When back online, sync:

Push any local `user_playback` with the device timestamp.

For queue changes, send a batch mutation to Convex. Use `onMutate` and optimistic updates so UI remains snappy.

If you need robust offline-first (edits on many devices), consider a CRDT or a local DB (e.g., TanStack DB / Electric) — but for most podcast apps last-write-wins with timestamps + user reconciliation is acceptable. (If you want to explore local-first DB integrations, TanStack DB docs have patterns for local-first sync.)

### Practical examples & API calls

_Subscribe_ (client):

mutate -> Convex createSubscription(userId, podcastFeedUrl, options)

onSuccess enqueue worker job enqueueFetchFeed(podcastId) (via your worker queue)

_Update playback_ (client):

debounced mutation `updatePlayback(userId, episodeId, positionSeconds, lastUpdatedAt)` (Convex mutation)

optimistic update via TanStack Query `onMutate` to set local cached `positionSeconds`.

_Move queue item_ (client):

call Convex mutation `moveQueueItem(userId, itemId, newPositionIndex)` which is atomic and returns latest queue snapshot.

### Notes

- _Rate limits_: PodcastIndex has API limits — cache feed results and batch updates. Don’t re-fetch the same feed too frequently; use podcasts.lastFetchedAt with exponential backoff.

- _Testing_: simulate multi-device races (two clients writing playback/queue at same time) to validate your conflict rules.

- _Monitoring_: track worker failures (feed fetch errors), and surface admin dashboard to retry failed jobs.

## Ad Detection Implementation

### Transcribe

- Use model (openAI/AssemblyAI/Deepgram) to transcribe audio from url into transcript
  - break audio into chunks to abide by 25MB transcription limit (`convex/utils/transcribe.ts`)
  - merge transcripts and return as segments (`{ id: string;, start: number; end: number; text: string }[]`)
- Build windows
  - prep data for LLM by breaking into slightly overlapping windows of 10-20s
- Classify windows (`convex/utils/llmBatchClassifier.ts`)
  - call LLM with batches of windows (batch to save tokens / reduce cost)
  - prompt LLM to classify each window with the format: `{ id_ad: boolean, confidence: 0-1, reason: string }`
  - return array of combined windows with LLM classification response
- Merge windows (`convex/utils/mergeWindows.ts`)
  - use classification and confidence to identify ad segments
- Run convex action to save each ad to the ads table
  - calc embedding from ad segment transcript
  - format:
  ```json
  {
    "podcastId": "podcastGUID",
    "episodeId": "episodeGUID",
    "convexEpId": "Id<'episodes'>",
    "audioUrl": "https://somepod.com/episode/123/audio.mp3",
    "start": 800, // time seconds
    "end": 845, // time seconds
    "duration": 45, // seconds
    "transcript": "text",
    "confidence": 0.89,
    "embedding": [0.23, 0.2839]
  }
  ```

### Broken into multi-step flow to accommodate Convex limits

1. mutation -> create `adJobs` doc (audioUrl, podId, episodeId, status, createdAt)

- trigger process to process audio
- await ctx.scheduler.runAfter(0, "adPipeline.fetchAudio", { jobId });

```typescript
// convex/adPipeline/start.ts
import { mutation } from 'convex/server';
import { v } from 'convex/values';

export const startAdDetection = mutation({
  args: {
    audioUrl: v.string(),
  },
  handler: async (ctx, { audioUrl }) => {
    const jobId = await ctx.db.insert('adJobs', {
      audioUrl,
      status: 'pending',
      createdAt: Date.now(),
    });

    // schedule next step
    await ctx.scheduler.runAfter(0, 'adPipeline.fetchAudio', { jobId });

    return jobId;
  },
});
```

2. process audio

- update `adJobs` with audio storage ID
  - await ctx.db.patch(jobId, { audioStorageId: storageId });
- trigger transcription
  - await ctx.scheduler.runAfter(0, "adPipeline.transcribe", { jobId });

```typescript
// convex/adPipeline/fetchAudio.ts
import { action } from 'convex/server';
import { v } from 'convex/values';

export const fetchAudio = action({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    const resp = await fetch(job.audioUrl);

    const arrayBuffer = await resp.arrayBuffer();
    const storageId = await ctx.storage.store(arrayBuffer);

    await ctx.db.patch(jobId, { audioStorageId: storageId });

    // continue pipeline
    await ctx.scheduler.runAfter(0, 'adPipeline.transcribe', { jobId });
  },
});
```

3. transcibe audio

```typescript
// convex/adPipeline/transcribe.ts
import { job } from 'convex/server';
import { v } from 'convex/values';

export const transcribe = job({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const jobRow = await ctx.db.get(jobId);

    const audio = await ctx.storage.get(jobRow.audioStorageId);
    if (!audio) throw new Error('Audio missing');

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: (() => {
        const fd = new FormData();
        fd.append('model', 'gpt-4o-audio-transcribe');
        fd.append(
          'file',
          new Blob([audio], { type: 'audio/mpeg' }),
          'audio.mp3'
        );
        fd.append('response_format', 'verbose_json');
        return fd;
      })(),
    });

    const transcript = await resp.json();

    await ctx.db.patch(jobId, {
      transcript,
      status: 'transcribed',
    });

    // next step
    await ctx.scheduler.runAfter(0, 'adPipeline.chunkTranscript', { jobId });
  },
});
```

4. Chunk transcript

```typescript
// convex/adPipeline/chunkTranscript.ts
import { mutation } from 'convex/server';
import { v } from 'convex/values';

export const chunkTranscript = mutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);

    const windows = createSlidingWindows(job.transcript.segments);

    // store windows in DB
    for (const w of windows) {
      await ctx.db.insert('windows', {
        jobId,
        ...w,
        classified: false,
        label: null,
      });
    }

    // schedule classification batches
    await ctx.scheduler.runAfter(0, 'adPipeline.classifyWindows', { jobId });
  },
});
```

5. Batch LLM classification (Convex Job)

- most likely to timeout ==> classify maybe 5 windows at a time:

```typescript
// convex/adPipeline/classifyWindows.ts
import { job } from 'convex/server';
import { v } from 'convex/values';

export const classifyWindows = job({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const windows = await ctx.db
      .query('windows')
      .withIndex('by_jobId_classified', (q) =>
        q.eq('jobId', jobId).eq('classified', false)
      )
      .take(5);

    if (windows.length === 0) {
      await ctx.scheduler.runAfter(0, 'adPipeline.mergeSegments', { jobId });
      return;
    }

    // LLM call for the batch
    const prompt = windows.map((w) => w.text).join('\n---\n');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Classify each:\n${prompt}` }],
      }),
    });

    const result = await resp.json();
    const labels = parseClassificationOutput(result);

    // write results
    for (let i = 0; i < windows.length; i++) {
      await ctx.db.patch(windows[i]._id, {
        classified: true,
        label: labels[i],
      });
    }

    // schedule next batch
    await ctx.scheduler.runAfter(0, 'adPipeline.classifyWindows', { jobId });
  },
});
```

6. Merge classified windows into ad segments

```typescript
// convex/adPipeline/mergeSegments.ts
import { mutation } from 'convex/server';
import { v } from 'convex/values';

export const mergeSegments = mutation({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const windows = await ctx.db
      .query('windows')
      .withIndex('by_jobId', (q) => q.eq('jobId', jobId))
      .collect();

    const segments = mergeAdjacentAds(windows);

    await ctx.db.patch(jobId, {
      segments,
      status: 'complete',
    });
  },
});
```
