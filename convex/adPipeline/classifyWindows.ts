'use node';

import { internal } from 'convex/_generated/api';
import { internalAction } from 'convex/_generated/server';
import { classifyWindowsBatch } from 'convex/utils/llmBatchClassifier';
import { v } from 'convex/values';

export const fn = internalAction({
  args: { jobId: v.id('adJobs') },
  handler: async (ctx, { jobId }) => {
    const windows = await ctx.runQuery(internal.adJobs.getWindows, { jobId });
    // ctx.db
    //   .query("windows")
    //   .withIndex("by_jobId_classified", q => q.eq("jobId", jobId).eq("classified", false))
    //   .take(5);

    if (windows.length === 0) {
      await ctx.scheduler.runAfter(0, internal.adPipeline.mergeSegments.fn, {
        jobId,
      });
      return;
    }

    // LLM call for the batch
    // let w = windows.map(win => ({ start: win.start, end: win.end, text: win.text}))
    const classifiedWindows = await classifyWindowsBatch(windows);

    // const prompt = windows.map(w => w.text).join("\n---\n");
    // const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     model: "gpt-4o-mini",
    //     messages: [{ role: "user", content: `Classify each:\n${prompt}` }],
    //   }),
    // });

    // const result = await resp.json();
    // const labels = parseClassificationOutput(result);

    // write results
    // await ctx.runMutation(internal.adJobs.classifyWindows, {})
    // for (let i = 0; i < windows.length; i++) {
    //   await ctx.db.patch(windows[i]._id, {
    //     classified: true,
    //     label: labels[i],
    //   });
    // }

    await ctx.runMutation(internal.adJobs.patchWindows, {
      windows: classifiedWindows,
    });

    // schedule next batch
    await ctx.scheduler.runAfter(0, internal.adPipeline.classifyWindows.fn, {
      jobId,
    });
  },
});
