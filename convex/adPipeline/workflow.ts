import { vWorkflowId, WorkflowManager } from '@convex-dev/workflow';
import { vResultValidator } from '@convex-dev/workpool';
import { components, internal } from 'convex/_generated/api';
import { internalMutation, query } from 'convex/_generated/server';
import { v } from 'convex/values';

// Docs: https://www.convex.dev/components/workflow
//

// Workflow limitations:
// - Steps can only take in and return a total of 1 MiB of data within a single workflow execution.
// -The workflow body is internally a mutation, with each step's return value read from the database on each subsequent step. As a result, the limits for a mutation apply and limit the number and size of steps you can perform to 16MiB

export const workflow = new WorkflowManager(components.workflow);

// alternative way to define sharable event (https://www.convex.dev/components/workflow#sharing-event-definitions):
// export const approvalEvent = defineEvent({
//   name: "WindowClassificationComplete",
//   validator: v.object({ completed: v.boolean() }),
// });

export const adDetectionWorkflow = workflow.define({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
  },
  returns: v.string(),
  handler: async (step, args): Promise<string> => {
    //                         ^ Specify the return type of the handler

    // event called when all batches have been classified
    const windowClassificationCompleteEventId = await workflow.createEvent(
      step,
      { name: 'WindowClassificationComplete', workflowId: step.workflowId }
    );

    // replaced by workflow, keeping until front end to updated
    const { jobId } = await step.runMutation(
      internal.adPipeline.workflow.createJob,
      { ...args, workflowId: step.workflowId },
      { name: 'createJob' }
    );

    // 1) transcribe audio from url
    const transcribeResult = await step.runAction(
      internal.adPipeline.transcribe.fn,
      {
        jobId,
      },
      { name: 'transcribe' }
    );

    // 2) break transcript into windows and write to 'adJobWindows' table
    const chunkTranscriptResult = await step.runMutation(
      internal.adPipeline.chunkTranscript.fn,
      {
        jobId,
      },
      { name: 'chunkTranscript' }
    );

    // 3) pass to LLM in batches to classify windows - called recursively (20 at a time)
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

    // 4) stitch together windows classified as ads into ad segments
    const mergeSegmentsResult = await step.runMutation(
      internal.adPipeline.mergeSegments.fn,
      {
        jobId,
      },
      { name: 'mergeSegments' }
    );

    // 5) write ad segments to `ads` table
    const saveToAdsResult = await step.runAction(
      internal.adPipeline.saveToAds.fn,
      {
        jobId,
      },
      { name: 'saveToAds' }
    );

    // return saveToAdsResult;
    return `${saveToAdsResult?.length ?? '0'} ad segments added to DB `; // [${args.episodeId}]
  },
});

// TODO: no longer needed ?? use workflow instead
export const createJob = internalMutation({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
    workflowId: vWorkflowId,
  },
  handler: async (ctx, { audioUrl, episodeId, workflowId }) => {
    const jobId = await ctx.db.insert('adJobs', {
      episodeId,
      audioUrl,
      status: 'pending',
      createdAt: Date.now(),
      workflowId,
    });

    return { jobId };
  },
});

export const handleOnComplete = internalMutation({
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
      console.error('Workflow failed', args.result.error);
    } else if (args.result.kind === 'canceled') {
      console.log('Workflow canceled', args.context);
    }
  },
});

export const status = query({
  args: { workflowId: vWorkflowId },
  handler: async (ctx, { workflowId }) => {
    return await workflow.status(ctx, workflowId);
  },
});
