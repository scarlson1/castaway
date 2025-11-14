import { createServerFn } from '@tanstack/react-start';
import ky from 'ky';
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

export interface AppleChartHit {
  artistName: string;
  id: string;
  name: string;
  kind: string;
  artworkUrl100: string;
  genres: {
    genreId: string;
    name: string;
    url: string;
  }[];
  url: string;
}

export interface AppleChartsResult {
  feed: {
    title: string;
    id: string;
    author: {
      name: string;
      url: string;
    };
    links: Record<string, string>[];
    copyright: string;
    country: string;
    icon: string;
    updated: string;
    results: AppleChartHit[];
  };
}

export const fetchAppleChartsOptions = z.object({
  market: z.string().optional(),
  limit: z.number().max(100).optional(),
});
export type FetchAppleChartsOptions = z.infer<typeof fetchAppleChartsOptions>;

export const fetchAppleCharts = createServerFn()
  .inputValidator(fetchAppleChartsOptions)
  .handler(async ({ data: { market = 'us', limit = 100 } }) => {
    const result = await ky
      .get<AppleChartsResult>(
        `https://rss.applemarketingtools.com/api/v2/${market}/podcasts/top/${limit}/podcasts.json`
      )
      .json();
    return result;
  });

interface MusicChartStatsResults {
  title: string;
  description: string;
  timestamp: number;
  items: {
    rank: number;
    boosts: string;
    title: string;
    image: string;
    feedId: number;
    feedUrl: string;
    feedGuid: string;
    itemGuid: string;
  };
}

// export const fetchMusicChartsStats = createServerFn()
//   // .inputValidator(fetchTrendingOptions)
//   .handler(async ({ data }) => {
//     const podClient = getPodClient();

//     const results = await podClient.custom<MusicChartStatsResults>(
//       'static/stats/v4vmusic.json'
//     );
//     return results;
//   });
