import { vWorkflowId, WorkflowManager } from '@convex-dev/workflow';
import { vResultValidator } from '@convex-dev/workpool';
import { components, internal } from 'convex/_generated/api';
import { internalMutation, mutation } from 'convex/_generated/server';
import { v } from 'convex/values';

export const workflow = new WorkflowManager(components.workflow);

export const adDetectionWorkflow = workflow.define({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
  },
  returns: v.string(),
  handler: async (step, args): Promise<string> => {
    //                         ^ Specify the return type of the handler

    const windowClassificationCompleteEventId = await workflow.createEvent(
      step,
      { name: 'WindowClassificationComplete', workflowId: step.workflowId }
    );

    // replaced by workflow, keeping until front end to updated
    const { jobId } = await step.runMutation(
      internal.adPipeline.workflow.createJob,
      args,
      { name: 'createJob' }
    );

    const transcribeResult = await step.runAction(
      internal.adPipeline.transcribe.fn,
      {
        jobId,
      },
      { name: 'transcribe' }
    );

    const chunkTranscriptResult = await step.runMutation(
      internal.adPipeline.chunkTranscript.fn,
      {
        jobId,
      },
      { name: 'chunkTranscript' }
    );

    // called recursively (20 at a time)
    const classifyWindowsResult = await step.runAction(
      internal.adPipeline.classifyWindows.fn,
      {
        jobId,
        eventId: windowClassificationCompleteEventId,
      },
      { name: 'classifyWindows' }
    );

    // wait for all batches to complete (classifyWindows is called recursively)
    await step.awaitEvent({ id: windowClassificationCompleteEventId });

    const mergeSegmentsResult = await step.runMutation(
      internal.adPipeline.mergeSegments.fn,
      {
        jobId,
      },
      { name: 'mergeSegments' }
    );

    const saveToAdsResult = await step.runAction(
      internal.adPipeline.saveToAds.fn,
      {
        jobId,
      },
      { name: 'saveToAds' }
    );

    // return saveToAdsResult;
    return `${saveToAdsResult?.length ?? '0'} ad segments added to DB [${
      args.episodeId
    }]`;
  },
});

// TODO: no longer needed ?? use workflow instead
export const createJob = internalMutation({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
  },
  handler: async (ctx, { audioUrl, episodeId }) => {
    const jobId = await ctx.db.insert('adJobs', {
      episodeId,
      audioUrl,
      status: 'pending',
      createdAt: Date.now(),
    });

    return { jobId };
  },
});

export const handleOnComplete = mutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.any(), // used to pass through data from the start site.
  },
  handler: async (ctx, args) => {
    const episodeId = (args.context as { episodeId: string }).episodeId;
    if (args.result.kind === 'success') {
      const text = args.result.returnValue;
      console.log(`EpId: ${episodeId} result: ${text}`);
    } else if (args.result.kind === 'failed') {
      // args.result.kind === "error"
      console.error('Workflow failed', args.result.error);
    } else if (args.result.kind === 'canceled') {
      console.log('Workflow canceled', args.context);
    }
  },
});

// export const kickoffWorkflow = mutation({
//   handler: async (ctx) => {
//     const name = "James";
//     const workflowId = await workflow.start(
//       ctx,
//       internal.example.exampleWorkflow,
//       { name},
//       {
//         onComplete: internal.example.handleOnComplete,
//         context: name, // can be anything
//       },
//     );
//     return {workflowId}
//   },
// });

// export const exampleWorkflow = workflow.define({
//   args: { name: v.string() },
//   returns: v.string(),
//   handler: async (step, args): Promise<string> => {
//     //                         ^ Specify the return type of the handler
//     const queryResult = await step.runQuery(
//       internal.example.exampleQuery,
//       args,
//     );
//     const actionResult = await step.runAction(
//       internal.example.exampleAction,
//       { queryResult }, // pass in results from previous steps!
//     );
//     return actionResult;
//   },
// });

// export const exampleQuery = internalQuery({
//   args: { name: v.string() },
//   handler: async (ctx, args) => {
//     return `The query says... Hi ${args.name}!`;
//   },
// });

// export const exampleAction = internalAction({
//   args: { queryResult: v.string() },
//   handler: async (ctx, args) => {
//     return args.queryResult + " The action says... Hi back!";
//   },
// });

// export const handleOnComplete = mutation({
//   args: {
//     workflowId: vWorkflowId,
//     result: vResultValidator,
//     context: v.any(), // used to pass through data from the start site.
//   },
//   handler: async (ctx, args) => {
//     const name = (args.context as { name: string }).name;
//     if (args.result.kind === "success") {
//       const text = args.result.returnValue;
//       console.log(`${name} result: ${text}`);
//     } else if (args.result.kind === "error") {
//       console.error("Workflow failed", args.result.error);
//     } else if (args.result.kind === "canceled") {
//       console.log("Workflow canceled", args.context);
//     }
//   },
// });
