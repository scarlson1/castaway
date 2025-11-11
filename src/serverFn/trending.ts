import { createServerFn } from '@tanstack/react-start';
import z from 'zod';
import { getPodClient } from '~/lib/podcastIndexClient';

export const fetchTrendingOptions = z.object({
  max: z.int().min(1).max(100).optional(),
  since: z.int().optional().nullable(),
  lang: z.string().optional().nullable(),
  cat: z.string().optional().nullable(),
  notcat: z.string().optional().nullable(),
});
export type FetchTrendingOptions = z.infer<typeof fetchTrendingOptions>;

// RPC pattern - server execution; client callable
export const fetchTrending = createServerFn()
  .inputValidator(fetchTrendingOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.podcastsTrending(
      data.max,
      data.since,
      data.lang,
      data.cat,
      data.notcat
    );
    return results;
  });
