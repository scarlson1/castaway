'use node';

import { api, internal } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { action, internalAction } from 'convex/_generated/server';
import { embeddingModelName } from 'convex/agent/models';
import { summarizeTranscript } from 'convex/utils/summarizeTranscript';
import { transcribeUrl } from 'convex/utils/transcribeUrl';
import { v } from 'convex/values';
import OpenAI from 'openai';

const openai = new OpenAI();

export const saveAdSegment = internalAction({
  args: {
    // sourceId: v.string(),
    podcastId: v.string(),
    episodeId: v.string(),
    convexEpId: v.id('episodes'),
    audioUrl: v.string(),
    start: v.number(),
    end: v.number(),
    transcript: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const embedding = await embed(args.transcript);

    const result: Id<'ads'> = await ctx.runMutation(
      internal.adSegments.saveAdDoc,
      {
        // sourceId: args.sourceId,
        podcastId: args.podcastId,
        episodeId: args.episodeId,
        convexEpId: args.convexEpId,
        audioUrl: args.audioUrl,
        start: args.start,
        end: args.end,
        duration: args.end - args.start,
        transcript: args.transcript,
        confidence: args.confidence,
        embedding,
      }
    );

    return result;
  },
});

// use to identify probable ad segments before sending to chatgpt ?? or to aid ??
export const searchAds = action({
  args: {
    // embedding: v.array(v.number()),
    searchQuery: v.string(),
    limit: v.optional(v.number()),
    podcastId: v.optional(v.string()),
  },
  handler: async (ctx, { limit, searchQuery, podcastId }) => {
    // https://docs.convex.dev/search/vector-search
    const embedding = await embed(searchQuery);

    const args = {
      vector: embedding,
      limit,
    };
    if (podcastId) args['filter'] = (q) => q.eq('podcastId', podcastId);

    return await ctx.vectorSearch('ads', 'by_embedding', args);
  },
});

async function embed(input: string, model = embeddingModelName) {
  const emb = await openai.embeddings.create({
    model,
    input,
  });

  return emb.data[0].embedding;
}

// TODO: break up into workflow (in transcripts)
// transcribe --> save to transcripts table --> pass transcript to RAG component to create embedding
export const transcribeEpisodeAndSaveTranscript = internalAction({
  args: {
    episodeId: v.string(),
    // convexEpId: v.id('episodes'),
    audioUrl: v.string(),
    episodeTitle: v.optional(v.string()),
    forceTranscribe: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { audioUrl, episodeId, episodeTitle, forceTranscribe = false }
  ) => {
    let transcript;
    if (!forceTranscribe) {
      let existingTranscript: Doc<'transcripts'> | null = await ctx.runQuery(
        api.transcripts.getByEpisodeId,
        { episodeId }
      );
      if (existingTranscript) {
        console.log('using existing transcript');
        transcript = {
          text: existingTranscript.fullText,
          segments: existingTranscript.segments,
        };
      }
    }
    if (!transcript) transcript = await transcribeUrl(audioUrl, {});

    // const transcript = await transcribeUrl(audioUrl, {});

    let summary: Pick<
      Doc<'transcripts'>,
      'episodeId' | 'audioUrl' | 'fullText' | 'segments'
    > &
      Partial<Doc<'transcripts'>> = {
      episodeId,
      audioUrl,
      fullText: transcript.text,
      segments: transcript.segments || [],
    };

    try {
      console.log('summarizing transcript...');
      const { title, ...rest } = await summarizeTranscript(transcript.text);
      console.log('SUMMARIZED TRANSCRIPT: ', title);
      // TODO: need to save summary / keywords in episode data to avoid fetching transcript doc every time we want to search/find similar ??

      summary = {
        ...summary,
        summaryTitle: title,
        ...rest,
      };
      await ctx.scheduler.runAfter(0, internal.episodes.updateEpisode, {
        episodeId,
        updates: {
          ...rest,
          summaryTitle: title,
        },
      });
    } catch (err) {
      console.error('error summarizing transcript: ', err);
    }

    console.log('saving transcript... ', summary.summaryTitle);
    const transcriptId: Id<'transcripts'> = await ctx.runMutation(
      internal.transcripts.save,
      summary
    );

    console.log('ADDING TRANSCRIPT TO RAG: ', summary);
    // add embedding to rag component (for episode search etc.)
    await ctx.scheduler.runAfter(0, internal.rag.insertEpisodeTranscript, {
      summary: summary.detailedSummary || transcript.text,
      title: episodeTitle || summary.summaryTitle || '', //  summary title redundant (derived from summary) prefer episode title if available
      keyTopics: summary.keyTopics || [],
      episodeId,
    });

    return { transcript, transcriptId };
  },
});

// part of transcribeWorkflow
export const transcribe = internalAction({
  args: {
    episodeId: v.string(),
    audioUrl: v.string(),
    // episodeTitle: v.optional(v.string()),
    forceTranscribe: v.optional(v.boolean()),
  },
  handler: async (ctx, { audioUrl, episodeId, forceTranscribe = false }) => {
    if (!forceTranscribe) {
      let existingTranscript: Doc<'transcripts'> | null = await ctx.runQuery(
        api.transcripts.getByEpisodeId,
        { episodeId }
      );
      if (existingTranscript) {
        console.log('using existing transcript');
        return { transcriptId: existingTranscript._id, exists: true };
      }
    }

    const transcript = await transcribeUrl(audioUrl, {});

    const transcriptId: Id<'transcripts'> = await ctx.runMutation(
      internal.transcripts.save,
      {
        episodeId,
        audioUrl,
        fullText: transcript.text,
        segments: transcript.segments || [],
      }
    );

    return { transcriptId, exists: false };
  },
});

// part of transcribeWorkflow
export const summarize = internalAction({
  args: {
    // episodeId: v.string(),
    transcriptId: v.id('transcripts'),
    forceSummarize: v.optional(v.boolean()),
  },
  handler: async (ctx, { transcriptId, forceSummarize }) => {
    const transcript: Doc<'transcripts'> | null = await ctx.runQuery(
      api.transcripts.getByConvexId,
      { id: transcriptId }
    );
    if (!transcript) throw new Error('transcript not found');

    if (transcript.detailedSummary && !forceSummarize) {
      console.log('already summarized. using previous summary');
      return {
        title: transcript.summaryTitle,
        oneSentenceSummary: transcript.oneSentenceSummary,
        detailedSummary: transcript.detailedSummary,
        keyTopics: transcript.keyTopics,
        notableQuotes: transcript.notableQuotes,
        exists: true,
      };
    }

    console.log('summarizing transcript...');
    const summary = await summarizeTranscript(transcript.fullText);
    const { title, ...rest } = summary;
    console.log('SUMMARIZED TRANSCRIPT: ', title);

    console.log('updating transcript with summary... ', title);
    await ctx.runMutation(internal.transcripts.update, {
      transcriptId,
      summaryTitle: title,
      ...rest,
    });

    return { ...summary, exists: false };
  },
});
