import type { Id } from 'convex/_generated/dataModel';
import { fetchPodEpisodesFromIndex } from 'convex/episodes';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action, type ActionCtx } from './_generated/server';

// ALTERNATIVELY: SCHEDULE FN TO RUN AFTER TO FETCH POD * EPISODES
// https://docs.convex.dev/tutorial/actions#hooking-it-up-to-your-app

export const subscribe = action({
  args: { podcastId: v.string() },
  handler: async (ctx, { podcastId }) => {
    // check if exists
    const { exists, convexId } = await ctx.runQuery(internal.podcasts.exists, {
      podcastId,
    });
    let id: Id<'podcasts'> | null = convexId;

    if (!exists) {
      // const podClient = getPodClient();
      // const { feed } = await podClient.podcastsByGUID(podcastId);

      // const feed = await ctx.runAction(internal.actions.fetchPodIndex, {
      //   podcastId,
      // });
      // https://docs.convex.dev/understanding/best-practices/#use-runaction-only-when-using-a-different-runtime (prefer not to use runAction in same runtime)
      const feed = await fetchPodIndex(ctx, {
        podcastId,
      });

      console.log(`fetched pod by guid: $${feed.id}`);

      // add to db
      const { id: newId } = await ctx.runMutation(internal.podcasts.add, {
        podcastId,
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
        mostRecentEpisode: feed.mostRecentEpisode || 0,
        categories: feed.categories || {},
        categoryArray: Object.values(feed.categories || {}) as string[],
        explicit: feed.explicit ?? null,
      });
      console.log(`Added podcast to DB ${podcastId} ${newId}`);
      id = newId as Id<'podcasts'>;

      const episodes = await fetchPodEpisodesFromIndex(podcastId);
      console.log(`${episodes?.length} episodes found - scheduling job`);

      // trigger fetch episodes job
      if (episodes.length) {
        await ctx.scheduler.runAfter(0, internal.episodes.saveEpisodesToDb, {
          episodes,
          podcastTitle: feed.title,
        });
      }
    } else {
      console.log('podcast already in DB');
    }
    if (!id) throw Error('internal error');

    // create subscription
    await ctx.runMutation(internal.subscribe.add, {
      podId: podcastId,
      podConvexId: id,
    });

    // return { success: true, subscriptionId };
  },
});

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
    const res = await api<{ feed: Record<string, any> }>(
      `podcasts/byguid?${params}`
    );
    console.log('res: ', JSON.stringify(res, null, 2));

    if (typeof res.body === 'string' || !res.body.feed)
      throw new Error(`podcast not found with ID ${podcastId}`);
    return res.body.feed;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
