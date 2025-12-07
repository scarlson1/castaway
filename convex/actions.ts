import type { Id } from 'convex/_generated/dataModel';
import { fetchPodEpisodesFromIndex } from 'convex/episodes';
import { v } from 'convex/values';
import type { PodcastsByFeedIdResult } from '~/lib/podcastIndexTypes';
import { internal } from './_generated/api';
import { action, type ActionCtx } from './_generated/server';

// ALTERNATIVELY: SCHEDULE FN TO RUN AFTER TO FETCH POD * EPISODES
// https://docs.convex.dev/tutorial/actions#hooking-it-up-to-your-app

const IMPORT_EPISODE_LIMIT = parseInt(process.env.DB_MAX_CONNECTIONS || '25');

export const subscribe = action({
  args: { podcastId: v.string() },
  handler: async (ctx, { podcastId }) => {
    // check if exists
    const { exists, convexId } = await ctx.runQuery(internal.podcasts.exists, {
      podcastId,
    });
    let id: Id<'podcasts'> | null = convexId;
    let itunesId: number | null | undefined;

    if (!exists) {
      // https://docs.convex.dev/understanding/best-practices/#use-runaction-only-when-using-a-different-runtime (prefer not to use runAction in same runtime)
      // uses fetch so 'use node' not required
      const feed = await fetchPodIndex(ctx, {
        podcastId,
      });

      console.log(`fetched pod by guid: $${feed.id}`);

      // add to db
      const newId = await saveNewPod(ctx, feed);
      id = newId as Id<'podcasts'>;
      itunesId = feed.itunesId;

      try {
        // runAfter --> fetch episodes from pod index --> internal.episodes.saveEpisodesToDb
        await fetchNewEpisodes(ctx, feed, IMPORT_EPISODE_LIMIT);
      } catch (err) {
        console.error(
          'failed to fetch episodes for newly created pod subscription',
          err
        );
      }
    } else {
      console.log('podcast already in DB');
    }
    if (!id) throw Error('internal error');

    // create subscription for user
    await ctx.runMutation(internal.subscribe.add, {
      podId: podcastId,
      podConvexId: id,
      itunesId: itunesId || null,
    });

    return { subscriptionId: id };
  },
});

export const subscribeitunesId = action({
  args: { itunesId: v.number() },
  handler: async (ctx, { itunesId }) => {
    const feed = await fetchPodIndexByitunesId(ctx, {
      itunesId: String(itunesId),
    });

    // check if exists
    const { exists, convexId } = await ctx.runQuery(internal.podcasts.exists, {
      podcastId: feed.podcastGuid,
    });
    let id: Id<'podcasts'> | null = convexId;

    if (!exists) {
      console.log(`fetched pod by guid: $${feed.podcastGuid}`);

      const newId = await saveNewPod(ctx, feed);
      id = newId as Id<'podcasts'>;

      try {
        // runAfter --> fetch episodes from pod index --> internal.episodes.saveEpisodesToDb
        await fetchNewEpisodes(ctx, feed, IMPORT_EPISODE_LIMIT);
      } catch (err) {
        console.error(
          'failed to fetch episodes for newly created pod subscription',
          err
        );
      }
    } else {
      console.log('podcast already in DB');
    }
    if (!id) throw Error('internal error');

    // create subscription
    await ctx.runMutation(internal.subscribe.add, {
      podId: feed.podcastGuid,
      podConvexId: id,
      itunesId,
    });

    return { subscriptionId: id };
  },
});

async function saveNewPod(
  ctx: ActionCtx,
  feed: PodcastsByFeedIdResult['feed']
) {
  // add to db
  const { id: newId } = await ctx.runMutation(internal.podcasts.add, {
    podcastId: feed.podcastGuid,
    itunesId: feed.itunesId || null,
    feedUrl: feed.url,
    link: feed.link || null,
    title: feed.title,
    author: feed.author,
    ownerName: feed.ownerName || '',
    description: feed.description,
    imageUrl: feed.image || feed.artwork || '',
    lastFetchedAt: 0,
    language: feed.language || 'en',
    episodeCount: feed.episodeCount || null, // update when episodes are fetched ??
    // @ts-ignore TODO: remove or fix type
    mostRecentEpisode: feed.mostRecentEpisode || 0,
    categories: feed.categories || {},
    categoryArray: Object.values(feed.categories || {}) as string[],
    explicit: Boolean(feed.explicit) ?? null,
  });
  console.log(`Added podcast to DB ${feed.podcastGuid} ${newId}`);

  return newId;
}

async function fetchNewEpisodes(
  ctx: ActionCtx,
  feed: PodcastsByFeedIdResult['feed'],
  limit: number = 100
) {
  const episodes = await fetchPodEpisodesFromIndex(feed.podcastGuid, {
    max: `${limit}`,
  });
  console.log(`${episodes?.length} episodes found - scheduling job`);

  if (episodes.length) {
    await ctx.scheduler.runAfter(0, internal.episodes.saveEpisodesToDb, {
      episodes,
      podcastTitle: feed.title,
    });
  }
}

const BASE_API_URL = 'https://api.podcastindex.org/api/1.0'; // replace with your base URL
const key = process.env.PODCAST_INDEX_KEY;
const secret = process.env.PODCAST_INDEX_SECRET;
const userAgent = 'CastawayPod/0.1';

async function sha1Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input); // identical to Buffer.from(input, 'utf8')
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  // convert ArrayBuffer to lowercase hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase(); // ensure lowercase!
}

export interface ApiResponse<T> {
  statusCode: number;
  ok: boolean;
  body: T | string;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const dt = Math.floor(Date.now() / 1000);
  const authHash = await sha1Hex(key + secret + dt);
  // const authHash = createHash('sha1')
  //   .update(key + secret + dt)
  //   .digest('hex');

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': userAgent,
    'X-Auth-Date': `${dt}`,
    'X-Auth-Key': key,
    Authorization: authHash,
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_API_URL}/${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const body = isJson ? await res.json() : await res.text();
  // let body: T | string;
  // try {
  //   body = isJson ? await res.json() : await res.text();
  // } catch {
  //   body = (await res.text()) as string;
  // }

  return {
    statusCode: res.status,
    ok: res.ok,
    body,
  };
}

export async function fetchPodIndex(
  ctx: ActionCtx,
  { podcastId }: { podcastId: string }
) {
  try {
    // const params = new URLSearchParams();
    // params.append('guid', podcastId);
    const params = new URLSearchParams({ guid: podcastId });
    const res = await api<PodcastsByFeedIdResult>(`podcasts/byguid?${params}`);
    console.log('res: ', JSON.stringify(res, null, 2));

    if (typeof res.body === 'string' || !res.body.feed)
      throw new Error(`podcast not found with ID ${podcastId}`);
    return res.body.feed;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function fetchPodIndexByitunesId(
  ctx: ActionCtx,
  { itunesId }: { itunesId: string }
) {
  try {
    // const params = new URLSearchParams();
    // params.append('guid', podcastId);
    const params = new URLSearchParams({ id: itunesId });
    const res = await api<PodcastsByFeedIdResult>(
      `podcasts/byitunesid?${params}`
    );
    console.log('res: ', JSON.stringify(res, null, 2));

    if (typeof res.body === 'string' || !res.body.feed)
      throw new Error(`podcast not found with iTunes ID ${itunesId}`);
    return res.body.feed;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
