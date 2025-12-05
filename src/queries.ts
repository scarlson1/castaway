import { queryOptions } from '@tanstack/react-query';
import {
  fetchRandomEpisodes,
  fetchRecentEpisodes,
  type FetchRecentEpisodesOptions,
  type RandomEpisodesOptions,
} from '~/serverFn/episodes';
import { fetchGenres } from '~/serverFn/genre';
import {
  fetchEpisodesByPodGuid,
  fetchPodDetailsByPodIndexId,
  fetPodDetailsByITunes,
} from '~/serverFn/podcast';
import { fetchTrending, type FetchTrendingOptions } from '~/serverFn/trending';

export const podDetailsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podIndex', 'podcasts', id],
    queryFn: () => fetchPodDetailsByPodIndexId({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const episodesQueryOptions = (
  id: string,
  options: { max?: number } = {}
) =>
  queryOptions({
    queryKey: ['podIndex', 'podcasts', id, 'episodes', options],
    queryFn: () => fetchEpisodesByPodGuid({ data: { id, ...options } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const trendingQueryOptions = (options: FetchTrendingOptions) =>
  queryOptions({
    queryKey: ['podIndex', 'podcasts', 'trending', options],
    queryFn: () => fetchTrending({ data: options }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const podDetailsITunesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podIndex', 'itunes', id],
    queryFn: () => fetPodDetailsByITunes({ data: { id } }),
    staleTime: Infinity,
  });

export const categoryQueryOptions = () =>
  queryOptions({
    queryKey: ['genre'],
    queryFn: () => fetchGenres(),
    staleTime: Infinity,
  });

export const recentEpisodesQueryOptions = (opts: FetchRecentEpisodesOptions) =>
  queryOptions({
    queryKey: ['podIndex', 'episodes', opts],
    queryFn: () => fetchRecentEpisodes({ data: opts }),
    staleTime: 1000 * 60 * 30,
  });

export const randomEpisodesQueryOptions = (opts: RandomEpisodesOptions) =>
  queryOptions({
    queryKey: ['podIndex', 'episodes', 'random', opts],
    queryFn: () => fetchRandomEpisodes({ data: opts }),
    staleTime: 1000 * 60 * 5,
  });
