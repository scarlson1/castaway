import { createServerFn } from '@tanstack/react-start';
import z from 'zod';
import { getPodClient } from '~/lib/podcastIndexClient';

// export const fetchGenresOptions = z.object({
//   max: z.int().min(1).max(100).optional(),
//   since: z.int().optional().nullable(),
//   lang: z.string().optional().nullable(),
//   cat: z.string().optional().nullable(),
//   notcat: z.string().optional().nullable(),
// });
// export type FetchGenresOptions = z.infer<typeof fetchGenresOptions>;

const feedCategory = z.object({
  id: z.number(),
  name: z.string(),
});

const fetchCategoriesResult = z.object({
  status: z.string(),
  // Allowed: z.boolean(),
  feeds: z.array(feedCategory),
  count: z.int(),
  description: z.string(),
});

export type FetchCategoriesResult = z.infer<typeof fetchCategoriesResult>;

// RPC pattern - server execution; client callable
export const fetchGenres = createServerFn()
  // .inputValidator(fetchGenresOptions)
  .handler(async () => {
    const podClient = getPodClient();

    const result = await podClient.categoriesList();
    return result.feeds;
  });
