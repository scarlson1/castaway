import { createServerFn } from '@tanstack/react-start';
import z from 'zod';
import { getPodClient } from '~/lib/podcastIndexClient';

export const fetchPodDetailsOptions = z.object({
  id: z.number(),
});
export type FetchPodDetailsOptions = z.infer<typeof fetchPodDetailsOptions>;

// RPC pattern - server execution; client callable
export const fetchPodDetailsByPodIndexId = createServerFn()
  .inputValidator(fetchPodDetailsOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.podcastsByFeedId(data.id);
    return results;
  });

export const fetPodDetailsByITunes = createServerFn()
  .inputValidator(fetchPodDetailsOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.podcastsByFeedItunesId(data.id);
    return results;
  });

export const fetchEpisodesByFeedId = createServerFn()
  .inputValidator(fetchPodDetailsOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.episodesByFeedId(data.id);
    return results;
  });

export const fetchEpisodeDetailsOptions = z.object({
  id: z.string(),
  since: z.number().optional(),
  max: z.number().optional(),
  fullText: z.boolean().optional(),
});
export type FetchEpisodeDetailsOptions = z.infer<
  typeof fetchEpisodeDetailsOptions
>;

export const fetchEpisodesByPodGuid = createServerFn()
  .inputValidator(fetchEpisodeDetailsOptions)
  .handler(async ({ data: { id, since, max, fullText } }) => {
    const podClient = getPodClient();

    const results = await podClient.episodesByPodGuid(id, since, max, fullText);
    return results;
  });

// const fetchPodcastByTagOptions = z.object({
//   tag: z.string(),
//   max: z.int().max(5000).optional(),
//   start_at: z.int().optional()
// })

//   export const fetchPodcastByTag = createServerFn()
//   .inputValidator(fetchPodcastByTagOptions)
//   .handler(async ({ data: { tag } }) => {
//     const podClient = getPodClient();

//     const results = await podClient.episodesByPodGuid(id, since, max, fullText);
//     return results;
//   });

// export const addPodToDb = createServerFn()
// .inputValidator(z.object({podId: z.string()}))
// .handler(async ({ data: { podId } }) => {
//   const exists = convex

//   const podClient = getPodClient();

//   const results = await podClient.podcastsByGUID(podId);

//   return { podId, convexId }
// }
