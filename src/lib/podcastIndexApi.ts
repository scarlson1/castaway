import { createHash } from 'crypto';
// import ky from 'ky';
import got from 'got';
import querystring, { type ParsedUrlQueryInput } from 'querystring';
import z from 'zod';
import type {
  EpisodesByFeedId,
  EpisodesByPodGuidResult,
  PodcastByGuidResult,
  PodcastsByFeedIdResult,
  SearchByTermResult,
  SearchByTermSchema,
  TrendingResult,
} from '~/lib/podcastIndexTypes';

// API docs: https://podcastindex-org.github.io/docs-api/#get-/search/byterm

// TODO: redo query options as object

const BASE_API_URL = 'https://api.podcastindex.org/api/1.0/';

const PATH_SEARCH_BY_TERM = 'search/byterm';
const PATH_SEARCH_BY_TITLE = 'search/bytitle';
const PATH_SEARCH_EPISODE_BY_PERSON = 'search/byperson';
const PATH_ADD_BY_FEED_URL = 'add/byfeedurl';
const PATH_ADD_BY_ITUNES_ID = 'add/byitunesid';
const PATH_EPISODES_BY_FEED_ID = 'episodes/byfeedid';
const PATH_EPISODES_BY_FEED_URL = 'episodes/byfeedurl';
const PATH_EPISODES_BY_PODCAST_GUID = 'episodes/bypodcastguid';
const PATH_EPISODES_BY_ITUNES_ID = 'episodes/byitunesid';
const PATH_EPISODES_BY_ID = 'episodes/byid';
const PATH_EPISODES_RANDOM = 'episodes/random';
const PATH_PODCASTS_BY_FEED_URL = 'podcasts/byfeedurl';
const PATH_PODCASTS_BY_FEED_ID = 'podcasts/byfeedid';
const PATH_PODCASTS_BY_ITUNES_ID = 'podcasts/byitunesid';
const PATH_PODCASTS_BY_GUID = 'podcasts/byguid';
const PATH_PODCASTS_BY_TAG = 'podcasts/bytag';
const PATH_PODCASTS_TRENDING = 'podcasts/trending';
const PATH_PODCASTS_DEAD = 'podcasts/dead';
const PATH_RECENT_FEEDS = 'recent/feeds';
const PATH_RECENT_EPISODES = 'recent/episodes';
const PATH_RECENT_NEWFEEDS = 'recent/newfeeds';
const PATH_RECENT_SOUNDBITES = 'recent/soundbites';
const PATH_VALUE_BY_FEED_ID = 'value/byfeedid';
const PATH_VALUE_BY_FEED_URL = 'value/byfeedurl';
const PATH_CATEGORIES_LIST = 'categories/list';
const PATH_HUB_PUBNOTIFIY = 'hub/pubnotify';

const PodIndexPath = z.enum([
  'search/byterm',
  'search/bytitle',
  'search/byperson',
  'add/byfeedurl',
  'add/byitunesid',
  'episodes/byfeedid',
  'episodes/byfeedurl',
  'episodes/bypodcastguid',
  'episodes/byitunesid',
  'episodes/byid',
  'episodes/random',
  'podcasts/byfeedurl',
  'podcasts/byfeedid',
  'podcasts/byitunesid',
  'podcasts/byguid',
  'podcasts/bytag',
  'podcasts/trending',
  'podcasts/dead',
  'recent/feeds',
  'recent/episodes',
  'recent/newfeeds',
  'recent/soundbites',
  'value/byfeedid',
  'value/byfeedurl',
  'categories/list',
  'hub/pubnotify',
  'static/stats/v4vmusic.json',
]);
type PodIndexPath = z.infer<typeof PodIndexPath>;

const qs = (o: ParsedUrlQueryInput = {}) => '?' + querystring.stringify(o);

const withResponse = <T>(response) => {
  // Check for success or failure and create a predictable error response
  let body = response.body;
  // if response.statusCode == 200?
  if (
    response.statusCode === 500 ||
    (body.hasOwnProperty('status') && body.status === 'false')
  ) {
    // Failed
    if (body.hasOwnProperty('description')) {
      // Error message from server API
      throw { message: body.description, code: response.statusCode };
    } else {
      throw { message: 'Request failed.', code: response.statusCode };
    }
  } else {
    // Success // 200
    return body as T;
  }
};

export default (
  key: string,
  secret: string,
  userAgent: string = 'CastawayPod/0.1'
) => {
  if (!key || !secret) {
    throw new Error(
      'API Key and Secret are required from https://api.podcastindex.org/'
    );
  }

  const api = got.extend({
    responseType: 'json',
    prefixUrl: BASE_API_URL,
    throwHttpErrors: false,
    headers: {
      'content-type': 'application/json',
    },
    hooks: {
      beforeRequest: [
        (options) => {
          let dt = Math.floor(Date.now() / 1000); // new Date().getTime() / 1000;
          options.headers['User-Agent'] = userAgent; // || 'PodcastIndexBot/@podcast@noagendasocial.com';
          options.headers['X-Auth-Date'] = `${dt}`;
          options.headers['X-Auth-Key'] = key;
          options.headers['Authorization'] = createHash('sha1')
            .update(key + secret + dt)
            .digest('hex');
        },
      ],
    },
  });

  const custom = async <T>(
    path: PodIndexPath,
    queries?: ParsedUrlQueryInput
  ) => {
    const response = await api(path + qs(queries));
    return withResponse<T>(response);
  };

  return {
    api,
    custom,

    // searchByTerm: async (
    //   q: string,
    //   val: 'any' | 'lightning' | 'hive' | 'webmonetization' | null = null,
    //   clean = false,
    //   fullText = false
    // ) => {
    //   let queries = {
    //     q: q,
    //   };
    //   if (val !== null) queries['val'] = val;
    //   if (clean) queries['clean'] = '';
    //   if (fullText) queries['fullText'] = '';
    //   return custom<SearchByTermResult>(PATH_SEARCH_BY_TERM, queries);
    // },
    searchByTerm: async ({
      query,
      cat,
      max,
      appleOnly,
      clean,
      similar,
      fullText,
      pretty,
    }: SearchByTermSchema) => {
      return custom<SearchByTermResult>(PATH_SEARCH_BY_TERM, {
        q: query,
        cat,
        max,
        aponly: appleOnly,
        clean,
        similar,
        fullText,
        pretty,
      });
    },
    searchByTitle: async (
      q: string,
      val = '',
      clean = false,
      fullText = false
    ) => {
      let queries = {
        q: q,
      };
      if (val !== '') queries['val'] = val;
      if (clean) queries['clean'] = '';
      if (fullText) queries['fullText'] = '';
      return custom(PATH_SEARCH_BY_TITLE, queries);
    },
    searchEpisodesByPerson: async (q: string, fullText = false) => {
      let queries = {
        q: q,
      };
      if (fullText) queries['fullText'] = '';
      return custom(PATH_SEARCH_EPISODE_BY_PERSON, queries);
    },

    podcastsByFeedUrl: async (feedUrl: string) => {
      return custom(PATH_PODCASTS_BY_FEED_URL, { url: feedUrl });
    },
    podcastsByFeedId: async (feedId: number) => {
      return custom<PodcastsByFeedIdResult>(PATH_PODCASTS_BY_FEED_ID, {
        id: feedId,
      });
    },
    podcastsByFeedItunesId: async (itunesId: number) => {
      return custom<PodcastsByFeedIdResult>(PATH_PODCASTS_BY_ITUNES_ID, {
        id: itunesId,
      });
    },
    podcastsByGUID: async (guid: string) => {
      return custom<PodcastByGuidResult>(PATH_PODCASTS_BY_GUID, { guid });
    },
    podcastsByTag: async () => {
      return custom(PATH_PODCASTS_BY_TAG, { 'podcast-value': '' });
    },
    podcastsTrending: async (
      max = 10,
      since: number | null = null,
      lang: string | null = 'en',
      cat: string | null = null,
      notcat: string | null = null
    ) => {
      return custom<TrendingResult>(PATH_PODCASTS_TRENDING, {
        max: max,
        since: since,
        lang: lang,
        cat: cat,
        notcat: notcat,
      });
    },
    podcastsDead: async () => {
      return custom(PATH_PODCASTS_DEAD);
    },

    addByFeedUrl: async (feedUrl, chash = null, itunesId = null) => {
      return custom(PATH_ADD_BY_FEED_URL, {
        url: feedUrl,
        chash: chash,
        itunesid: itunesId,
      });
    },
    addByItunesId: async (itunesId) => {
      return custom(PATH_ADD_BY_ITUNES_ID, { id: itunesId });
    },

    episodesByFeedId: async (
      feedId,
      since = null,
      max = 10,
      fullText = false
    ) => {
      let queries = {
        id: feedId,
        since: since,
        max: max,
      };
      if (fullText) queries['fullText'] = '';
      return custom<EpisodesByFeedId>(PATH_EPISODES_BY_FEED_ID, queries);
    },
    episodesByFeedUrl: async (
      feedUrl,
      since = null,
      max = 10,
      fullText = false
    ) => {
      let queries = {
        url: feedUrl,
        since: since,
        max: max,
      };
      if (fullText) queries['fullText'] = '';
      return custom(PATH_EPISODES_BY_FEED_URL, queries);
    },
    episodesByPodGuid: async (
      guid: string,
      since: number | null = null,
      max = 1000,
      fullText = true
    ) => {
      let queries = {
        guid,
        since: since,
        max: max,
      };
      if (fullText) queries['fullText'] = '';
      return custom<EpisodesByPodGuidResult>(
        PATH_EPISODES_BY_PODCAST_GUID,
        queries
      );
    },
    episodesByItunesId: async (
      itunesId,
      since = null,
      max = 10,
      fullText = true
    ) => {
      let queries = {
        id: itunesId,
        since: since,
        max: max,
      };
      if (fullText) queries['fullText'] = '';
      return custom(PATH_EPISODES_BY_ITUNES_ID, queries);
    },
    episodesById: async (id, fullText = true) => {
      let queries = {
        id: id,
      };
      if (fullText) queries['fullText'] = '';
      return custom(PATH_EPISODES_BY_ID, queries);
    },
    episodesRandom: async (
      max = 1,
      lang = null,
      cat = null,
      notcat = null,
      fullText = true
    ) => {
      let queries = {
        max: max,
        lang: lang,
        cat: cat,
        notcat: notcat,
      };
      if (fullText) queries['fullText'] = '';
      return custom(PATH_EPISODES_RANDOM, queries);
    },

    recentFeeds: async (
      max = 40,
      since = null,
      cat = null,
      lang = null,
      notcat = null
    ) => {
      return custom(PATH_RECENT_FEEDS, {
        max: max,
        since: since,
        lang: lang,
        cat: cat,
        notcat: notcat,
      });
    },
    recentEpisodes: async (
      max = 10,
      excludeString = null,
      before = null,
      fullText = true
    ) => {
      let queries = {
        max: max,
        excludeString: excludeString ? excludeString : null,
        before: before,
      };
      if (fullText) queries['fullText'] = '';
      return custom(PATH_RECENT_EPISODES, queries);
    },
    recentNewFeeds: async (max = 20, since = null) => {
      return custom(PATH_RECENT_NEWFEEDS, {
        max: max,
        since: since,
      });
    },
    recentSoundbites: async (max = 20) => {
      return custom(PATH_RECENT_SOUNDBITES, {
        max: max,
      });
    },

    valueByFeedId: async (feedId) => {
      return custom(PATH_VALUE_BY_FEED_ID, {
        id: feedId,
      });
    },
    valueByFeedUrl: async (feedUrl) => {
      return custom(PATH_VALUE_BY_FEED_URL, {
        url: feedUrl,
      });
    },

    categoriesList: async () => {
      return custom(PATH_CATEGORIES_LIST);
    },

    hubPubNotifyById: async (feedId) => {
      let queries = {
        id: feedId,
      };
      return custom(PATH_HUB_PUBNOTIFIY, queries);
    },
    hubPubNotifyByUrl: async (feedUrl) => {
      let queries = {
        url: feedUrl,
      };
      return custom(PATH_HUB_PUBNOTIFIY, queries);
    },
  };
};
