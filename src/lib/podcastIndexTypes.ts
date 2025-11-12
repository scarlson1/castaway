import z from 'zod';

const PodcastFeed = z.object({
  id: z.int(),
  podcastGuid: z.string(),
  title: z.string(),
  url: z.string(),
  originalUrl: z.string(),
  link: z.string(),
  description: z.string(),
  author: z.string(),
  // below are optional ?? (chatgpt)
  ownerName: z.string().optional(),
  image: z.string().optional(),
  artwork: z.string().optional(),
  lastUpdateTime: z.int().optional(),
  lastCrawlTime: z.int().optional(),
  lastParseTime: z.int().optional(),
  lastGoodHttpStatusTime: z.int().optional(),
  lastHttpStatus: z.int().optional(),
  contentType: z.string().optional(), // 'application/rss+xml',
  itunesId: z.int().nullable().optional(),
  generator: z.string().optional(),
  language: z.string().optional(), // 'en-us',
  explicit: z.boolean().optional(),
  type: z.number().optional(), // 0: RSS; 1: Atom
  medium: z.string().optional(),
  dead: z.int().optional(),
  episodeCount: z.int().optional(),
  crawlErrors: z.int().optional(),
  parseErrors: z.int().optional(),
  categories: z.record(z.string(), z.string()).optional(),
  locked: z.int().optional(), // 0: 'no'; 1: 'yes'
  imageUrlHash: z.int().optional(), // A CRC32 hash of the image URL with the protocol (http://, https://) removed. 64bit integer.
  newestItemPubdate: z.int().optional(), // Note: some endpoints use newestItemPubdate while others use newestItemPublishTime.
  // See https://github.com/Podcastindex-org/api/issues/3 to track when the property name is updated.
  newestItemPublishTime: z.int().optional(),
});
export type PodcastFeed = z.infer<typeof PodcastFeed>;

// https://podcastindex-org.github.io/docs-api/#get-/search/bytitle
export const SearchByTermResult = z.object({
  status: z.enum(['true', 'false']),
  feeds: z.array(PodcastFeed),
  count: z.number(),
  query: z.string(),
  description: z.string().optional(),
});
export type SearchByTermResult = z.infer<typeof SearchByTermResult>;

export const TrendingResult = z.object({
  status: z.enum(['true', 'false']),
  feeds: z.array(PodcastFeed),
  count: z.int(),
  max: z.int().nullable(),
  since: z.int().nullable(),
  description: z.string().optional(),
});
export type TrendingResult = z.infer<typeof TrendingResult>;

const FeedValue = z.object({
  model: z.object({
    type: z.string(),
    method: z.string(),
    suggested: z.string(),
  }),
  destinations: z.array(
    z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      type: z.string().optional(),
      split: z.number().optional(),
      fee: z.boolean().optional(),
      customKey: z.string().optional(),
      customValue: z.string().optional(),
    })
  ),
});

export const PodcastsByFeedIdResult = z.object({
  status: z.enum(['true', 'false']),
  query: z.object({ id: z.string() }),
  feed: PodcastFeed.extend({
    value: FeedValue.optional(),
    function: z
      .object({
        url: z.string().optional(),
        message: z.string().optional(),
      })
      .optional(),
  }),
});
export type PodcastsByFeedIdResult = z.infer<typeof PodcastsByFeedIdResult>;

const episodeLiveItem = z.object({
  id: z.int(),
  title: z.string(),
  link: z.string().optional(),
  description: z.string(),
  guid: z.string(),
  datePublished: z.int(),
  datePublishedPretty: z.string(),
  dateCrawled: z.int(),
  enclosureUrl: z.string(),
  enclosureType: z.string(),
  enclosureLength: z.int().optional(),
  startTime: z.int().optional(),
  endTime: z.int().optional(),
  status: z.string().optional(),
  contentLink: z.string().optional(),
  duration: z.int().nullable(),
  explicit: z.int(),
  episode: z.int().optional(),
  episodeType: z.string(),
  season: z.int().optional(),
  image: z.string().optional(),
  feedItunesId: z.int(),
  feedUrl: z.string().optional(),
  feedImage: z.string(),
  feedId: z.int(),
  podcastGuid: z.string(),
  feedLanguage: z.string(),
  feedDead: z.int(),
  feedDuplicateOf: z.int().nullable(),
  chaptersUrl: z.string().nullable(),
  transcriptUrl: z.string().nullable(),
});
export type EpisodeLiveItem = z.infer<typeof episodeLiveItem>;

const episodeItem = episodeLiveItem.extend({
  transcripts: z
    .array(
      z.object({
        url: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  soundbite: z
    .object({
      startTime: z.number(),
      duration: z.number(),
      title: z.string(),
    })
    .optional(),
  soundbites: z
    .array(
      z.object({
        startTime: z.number(),
        duration: z.number(),
        title: z.string(),
      })
    )
    .optional(),
  persons: z
    .array(
      z.object({
        id: z.int(),
        name: z.string(),
        role: z.string(),
        group: z.string(),
        href: z.string().optional(),
        img: z.string().optional(),
      })
    )
    .optional(),
  socialInteract: z
    .array(
      z.object({
        url: z.string().optional(),
        protocol: z.string(),
        accountId: z.string(),
        accountUrl: z.string().optional(),
        priority: z.int().optional(),
      })
    )
    .optional(),
  value: FeedValue.optional(),
});
export type EpisodeItem = z.infer<typeof episodeItem>;

export const EpisodesByFeedId = z.object({
  status: z.enum(['true', 'false']),
  liveItems: z.array(episodeLiveItem),
  items: z.array(episodeItem),
  count: z.number(),
  query: z.any(), // z.string().or(z.array(z.string())),
  description: z.string().optional(),
});
export type EpisodesByFeedId = z.infer<typeof EpisodesByFeedId>;

export const EpisodesByPodGuidResult = z.object({
  status: z.enum(['true', 'false']),
  liveItems: z.array(episodeLiveItem),
  items: z.array(episodeItem),
  count: z.number(),
  query: z.any(), // z.string().or(z.array(z.string())),
  description: z.string().optional(),
});
export type EpisodesByPodGuidResult = z.infer<typeof EpisodesByPodGuidResult>;
