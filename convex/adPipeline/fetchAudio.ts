// import { api, internal } from 'convex/_generated/api';
// import { internalAction } from 'convex/_generated/server';
// import { v } from 'convex/values';

// only reason to keep is if audio is used to train model ??

// // DELETE step ?? can use the original audio url instead ??

// export const fn = internalAction({
//   args: { jobId: v.id('adJobs') },
//   handler: async (ctx, { jobId }) => {
//     // const job = await ctx.db.get(jobId);
//     const job = await ctx.runQuery(api.adJobs.getById, { id: jobId });
//     if (!job) throw new Error('job missing audioUrl');
//     // const resp = await fetch(job.audioUrl);

//     // // const arrayBuffer = await resp.arrayBuffer();
//     // const blob = await resp.blob();
//     // const storageId = await ctx.storage.store(blob);

//     // await ctx.runMutation(internal.adJobs.patch, {
//     //   id: jobId,
//     //   updates: { audioStorageId: storageId },
//     // });

//     // continue pipeline
//     await ctx.scheduler.runAfter(0, internal.adPipeline.transcribe.fn, {
//       jobId,
//     });
//   },
// });
export {};
