import { createServerFn } from '@tanstack/react-start';
import z from 'zod';
import { getPodClient } from '~/lib/podcastIndexClient';

export const fetchPodDetailsOptions = z.object({
  id: z.number(),
});
export type FetchPodDetailsOptions = z.infer<typeof fetchPodDetailsOptions>;

// RPC pattern - server execution; client callable
export const fetchPodDetails = createServerFn()
  .inputValidator(fetchPodDetailsOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.podcastsByFeedId(data.id);
    return results;
  });

export const fetchEpisodes = createServerFn()
  .inputValidator(fetchPodDetailsOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.episodesByFeedId(data.id);
    return results;
  });
