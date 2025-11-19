import { queryOptions } from '@tanstack/react-query';
import {
  fetchEpisodesByPodGuid,
  fetchPodDetailsByPodIndexId,
  fetPodDetailsByITunes,
} from '~/serverFn/podcast';
import { fetchTrending, type FetchTrendingOptions } from '~/serverFn/trending';

export const podDetailsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podcast', id],
    queryFn: () => fetchPodDetailsByPodIndexId({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const episodesQueryOptions = (
  id: string,
  options: { max?: number } = {}
) =>
  queryOptions({
    queryKey: ['podcast', id, 'episodes', options],
    queryFn: () => fetchEpisodesByPodGuid({ data: { id, ...options } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const trendingQueryOptions = (options: FetchTrendingOptions) =>
  queryOptions({
    queryKey: ['trending', options],
    queryFn: () => fetchTrending({ data: options }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const podDetailsITunesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podcast', id],
    queryFn: () => fetPodDetailsByITunes({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });
