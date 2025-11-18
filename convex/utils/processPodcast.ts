'use node';

import { internal } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { type ActionCtx } from 'convex/_generated/server';
import { buildWindows } from 'convex/utils/buildWindows';
import { classifyWindowsBatch } from 'convex/utils/llmBatchClassifier';
import { mergeAdWindows } from 'convex/utils/mergeWindows';
import { transcribeUrl } from 'convex/utils/transcribeUrl';
// import { transcriptFromUrl } from 'convex/utils/transcribe';

export async function processPodcast(
  ctx: ActionCtx,
  {
    audioUrl,
    episodeId,
    convexEpId,
    podcastId,
  }: {
    audioUrl: string;
    episodeId: string;
    convexEpId: Id<'episodes'>;
    podcastId: string;
  }
) {
  // TODO: fetch episode in action to get episode info

  // 1. Transcribe
  console.log(`transcribing podcast from url [${episodeId}]...`);
  // const transcript = await transcribeFromUrl(audioUrl, {
  //   model: 'whisper-1',
  //   responseFormat: 'verbose_json',
  // });
  const transcript = await transcribeUrl(audioUrl, {
    model: 'whisper-1',
    responseFormat: 'verbose_json',
  });
  const segments = transcript.segments ?? [
    { start: 0, end: 0, text: transcript.text, id: 0 },
  ];

  // 2. Build windows
  console.log('building windows...');
  const windows = buildWindows(segments);
  console.log(`windows length: ${windows.length}`);

  // 3. Batch classify (batch size of e.g. 20)
  const batchSize = 20;
  const classified: any[] = [];

  for (let i = 0; i < windows.length; i += batchSize) {
    const chunk = windows.slice(i, i + batchSize);
    console.log(`batch classifying windows [${i}]...`);
    const result = await classifyWindowsBatch(chunk);
    classified.push(...result);
  }

  // 4. Merge
  console.log(`merging ad windows...`);
  const ads = mergeAdWindows(classified);
  console.log(`$${ads.length} ads detected in ${episodeId}`);

  // 5. Save in Convex
  // const convex = new ConvexClient(process.env.CONVEX_URL!);
  for (const ad of ads) {
    // await convex.mutation(api.actions.saveAdSegment, {
    console.log(
      `saving ad segment - confidence: ${ad.confidence} [${ad.start}:${ad.end}]...`
    );
    await ctx.runAction(internal.node.saveAdSegment, {
      // sourceId,
      podcastId,
      episodeId,
      convexEpId,
      audioUrl,
      start: ad.start,
      end: ad.end,
      transcript: ad.transcript,
      confidence: ad.confidence,
    });
  }

  return ads;
}

// export const transcribeAndClassify = action({
//   args: {
//     audioUrl: v.string(),
//     episodeId: v.string(),
//     convexEpId: v.id('episodes'),
//     podcastId: v.string(),
//   },
//   handler: async (
//     ctx,
//     { audioUrl, episodeId, convexEpId, podcastId }
//   ): Promise<{ resultId: Id<'adSegments'>; ads: WindowTime[] }> => {
//     console.log(`transcribing...`);
//     console.log(`audioUrl: ${audioUrl}`);
//     // 1. Transcribe remote audio
//     const transcript = await transcribeFromUrl(audioUrl, {
//       responseFormat: 'verbose_json',
//     });

//     const segments = transcript.segments ?? [];
//     console.log(
//       `segments count: ${transcript.segments?.length} [text: ${transcript?.text?.length}]`
//     );

//     // 2. Build windows
//     console.log(`building windows...`);
//     const windows: Window[] = [];
//     let buffer: typeof segments = [];

//     for (const seg of segments) {
//       buffer.push(seg);
//       const start = buffer[0].start;
//       const end = buffer[buffer.length - 1].end;

//       if (end - start >= windowSizeSec) {
//         windows.push({
//           start,
//           end,
//           text: buffer.map((s) => s.text).join(' '),
//         });
//         buffer = [];
//       }
//     }

//     console.log(`classifying windows...`);
//     // 3. Classify windows
//     const labeled: LabelledWindow[] = [];
//     for (const w of windows) {
//       // TODO: use classifyWindowsBatch instead
//       const label = await classifyTranscriptWindow(w.text);
//       labeled.push({ ...w, label });
//     }

//     console.log(`merging windows...`);
//     // 4. Merge "ad" windows
//     const merged: WindowTime[] = [];
//     let current: WindowTime | null = null;

//     for (const w of labeled) {
//       if (w.label !== 'ad') continue;

//       if (!current) {
//         current = { start: w.start, end: w.end };
//       } else if (w.start <= current.end + 3) {
//         current.end = w.end;
//       } else {
//         merged.push(current);
//         current = { start: w.start, end: w.end };
//       }
//     }
//     if (current) merged.push(current);

//     console.log(`saving to db...`);
//     // 5. Store results
//     // const resultId = await ctx.db.insert('adSegments', {
//     //   audioUrl,
//     //   ads: merged,
//     //   createdAt: Date.now(),
//     // });
//     const resultId = await ctx.runMutation(internal.adSegments.insert, {
//       audioUrl,
//       ads: merged,
//       episodeId,
//       convexEpId,
//       podcastId,
//     });

//     return { resultId, ads: merged };
//   },
// });
