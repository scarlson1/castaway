import { vWorkflowId, WorkflowManager } from '@convex-dev/workflow';
import { vResultValidator } from '@convex-dev/workpool';
import { api, components, internal } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { internalMutation } from 'convex/_generated/server';
import type { EpisodeSummary } from 'convex/utils/summarizeTranscript';
import { v } from 'convex/values';

export const workflow = new WorkflowManager(components.workflow);

export const transcribeWorkflow = workflow.define({
  args: {
    episodeId: v.string(),
    // audioUrl: v.string(),
    forceTranscribe: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (step, { episodeId, forceTranscribe }): Promise<string> => {
    const episode = await step.runQuery(api.episodes.getByGuid, {
      id: episodeId,
    }); // getEpisodeById(ctx.db, episodeId);
    if (!episode?.audioUrl) throw new Error('episode not found');

    // transcribe
    const {
      transcriptId,
    }: { transcriptId: Id<'transcripts'>; exists: boolean } =
      await step.runAction(internal.node.transcribe, {
        episodeId,
        audioUrl: episode.audioUrl,
        forceTranscribe,
      });

    // summarize
    const { exists, title, ...summary }: EpisodeSummary & { exists: boolean } =
      await step.runAction(internal.node.summarize, {
        transcriptId,
        forceSummarize: forceTranscribe,
      });

    // update episode
    if (!exists) {
      await step.runMutation(internal.episodes.updateEpisode, {
        episodeId,
        updates: {
          ...summary,
          summaryTitle: title,
        },
      });
    }

    // runAfter ?? do we want workflow to fail ??
    // save to rag component
    let addedRAG = false;
    try {
      await step.runAction(internal.rag.insertEpisodeTranscript, {
        summary: summary.detailedSummary || episode.summary,
        title: episode.title || title || '', //  summary title redundant (derived from summary) prefer episode title if available
        keyTopics: summary.keyTopics || [],
        episodeId,
      });
      addedRAG = true;
    } catch (err) {
      console.error(err);
    }

    return `Transcribed & summarized episode. ${
      addedRAG ? 'Added' : 'Failed to add'
    } transcript summary to RAG component.`;
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
