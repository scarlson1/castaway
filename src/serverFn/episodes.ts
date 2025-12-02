import { createServerFn } from '@tanstack/react-start';
import z from 'zod';
import { getPodClient } from '~/lib/podcastIndexClient';

export const fetchRecentEpisodesOptions = z.object({
  max: z.number().optional(),
  excludeString: z.string().optional(),
  before: z.number().optional(),
  fullText: z.boolean().optional(),
});
export type FetchRecentEpisodesOptions = z.infer<
  typeof fetchRecentEpisodesOptions
>;

const recentEpisodeItem = z.object({
  id: z.int(),
  title: z.string(),
  link: z.string(),
  description: z.string(),
  guid: z.string(),
  datePublished: z.int(),
  datePublishedPretty: z.string(),
  dateCrawled: z.int(),
  enclosureUrl: z.string(),
  enclosureType: z.string(),
  enclosureLength: z.int(),
  explicit: z.int(),
  episode: z.int().nullable(),
  episodeType: z.string().nullable(), // Allowed: full┃trailer┃bonus
  season: z.int().nullable(),
  image: z.string(),
  feedItunesId: z.int().nullable(),
  feedImage: z.string(),
  feedId: z.int(),
  feedTitle: z.string(),
  feedLanguage: z.string(),
});

const recentEpisodesResult = z.object({
  status: z.string(),
  items: z.array(recentEpisodeItem),
  count: z.number(),
  max: z.number().nullable(),
  description: z.string(),
});
export type RecentEpisodesResult = z.infer<typeof recentEpisodesResult>;

export const fetchRecentEpisodes = createServerFn()
  .inputValidator(fetchRecentEpisodesOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.recentEpisodes(data);
    return results.items;
  });

const fetchRandomEpisodesOptions = z.object({
  max: z.number().optional(),
  lang: z.string().optional(),
  cat: z.string().optional(),
  notcat: z.string().optional(),
  fulltext: z.string().optional(),
});
export type RandomEpisodesOptions = z.infer<typeof fetchRandomEpisodesOptions>;

const randomEpisodeItem = recentEpisodeItem.extend({
  categories: z.any(), // format ?? = [{ [catId]: 'category' }]
  chaptersUrl: z.string().nullable(),
});

const randomEpisodesResult = z.object({
  status: z.string(),
  episodes: z.array(randomEpisodeItem),
  count: z.number(),
  max: z.number().nullable(),
  description: z.string(),
});
export type RandomEpisodesResult = z.infer<typeof randomEpisodesResult>;

export const fetchRandomEpisodes = createServerFn()
  .inputValidator(fetchRandomEpisodesOptions)
  .handler(async ({ data }) => {
    const podClient = getPodClient();

    const results = await podClient.episodesRandom(data);
    return results.episodes;
  });
