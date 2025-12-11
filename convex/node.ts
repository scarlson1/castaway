'use node';

import { internal } from 'convex/_generated/api';
import { action, internalAction } from 'convex/_generated/server';
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
    // const emb = await openai.embeddings.create({
    //   model: 'text-embedding-3-small', // 'text-embedding-3-large',
    //   input: args.transcript,
    // });

    // const embedding = emb.data[0].embedding;
    const embedding = await embed(args.transcript);

    await ctx.runMutation(internal.adSegments.saveAdDoc, {
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
    });

    return { ok: true };
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

async function embed(input: string, model = 'text-embedding-3-small') {
  // 'text-embedding-3-large',
  const emb = await openai.embeddings.create({
    model,
    input,
  });

  return emb.data[0].embedding;
}

// transcribe --> save to transcripts table --> pass transcript to RAG component to create embedding
export const transcribeEpisodeAndSaveTranscript = internalAction({
  args: {
    episodeId: v.string(),
    // convexEpId: v.id('episodes'),
    audioUrl: v.string(),
  },
  handler: async (ctx, { audioUrl, episodeId }) => {
    const transcript = await transcribeUrl(audioUrl, {});

    const transcriptId = await ctx.runMutation(internal.transcripts.save, {
      episodeId,
      audioUrl,
      fullText: transcript.text,
      segments: transcript.segments || [],
    });

    // add embedding to rag component (for episode search etc.)
    await ctx.scheduler.runAfter(0, internal.rag.insertEpisodeTranscript, {
      transcript: transcript.text,
      episodeId,
    });

    return { transcript, transcriptId };
  },
});
