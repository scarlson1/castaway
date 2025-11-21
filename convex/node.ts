'use node';

import { internal } from 'convex/_generated/api';
import { internalAction } from 'convex/_generated/server';
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
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 'text-embedding-3-large',
      input: args.transcript,
    });

    const embedding = emb.data[0].embedding;

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
