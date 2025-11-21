// replaced by pipeline - DELETE ??

// 'use node';

// import { internal } from 'convex/_generated/api';
// import type { Id } from 'convex/_generated/dataModel';
// import { type ActionCtx } from 'convex/_generated/server';
// import { buildWindows } from 'convex/utils/buildWindows';
// import { classifyWindowsBatch } from 'convex/utils/llmBatchClassifier';
// import { mergeAdWindows } from 'convex/utils/mergeWindows';
// import { transcribeUrl } from 'convex/utils/transcribeUrl';

// export async function processPodcast(
//   ctx: ActionCtx,
//   {
//     audioUrl,
//     episodeId,
//     convexEpId,
//     podcastId,
//   }: {
//     audioUrl: string;
//     episodeId: string;
//     convexEpId: Id<'episodes'>;
//     podcastId: string;
//   }
// ) {
//   // TODO: fetch episode in action to get episode info

//   // 1. Transcribe
//   console.log(`transcribing podcast from url [${episodeId}]...`);
//   // const transcript = await transcribeFromUrl(audioUrl, {
//   //   model: 'whisper-1',
//   //   responseFormat: 'verbose_json',
//   // });
//   const transcript = await transcribeUrl(audioUrl, {
//     model: 'whisper-1',
//     responseFormat: 'verbose_json',
//   });
//   const segments = transcript.segments ?? [
//     { start: 0, end: 0, text: transcript.text, id: 0 },
//   ];

//   // 2. Build windows
//   console.log('building windows...');
//   const windows = buildWindows(segments);
//   console.log(`windows length: ${windows.length}`);

//   // 3. Batch classify (batch size of e.g. 20)
//   const batchSize = 20;
//   const classified: any[] = [];

//   for (let i = 0; i < windows.length; i += batchSize) {
//     const chunk = windows.slice(i, i + batchSize);
//     console.log(`batch classifying windows [${i}]...`);
//     const result = await classifyWindowsBatch(chunk);
//     classified.push(...result);
//   }

//   // 4. Merge
//   console.log(`merging ad windows...`);
//   const ads = mergeAdWindows(classified);
//   console.log(`$${ads.length} ads detected in ${episodeId}`);

//   // 5. Save in Convex
//   // const convex = new ConvexClient(process.env.CONVEX_URL!);
//   for (const ad of ads) {
//     // await convex.mutation(api.actions.saveAdSegment, {
//     console.log(
//       `saving ad segment - confidence: ${ad.confidence} [${ad.start}:${ad.end}]...`
//     );
//     await ctx.runAction(internal.node.saveAdSegment, {
//       // sourceId,
//       podcastId,
//       episodeId,
//       convexEpId,
//       audioUrl,
//       start: ad.start,
//       end: ad.end,
//       transcript: ad.transcript,
//       confidence: ad.confidence,
//     });
//   }

//   return ads;
// }
