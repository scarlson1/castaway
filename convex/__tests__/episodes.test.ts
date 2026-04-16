import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api, internal } from '../_generated/api';
import schema from '../schema';

const modules = import.meta.glob('../**/*.*s');

// POLL_INTERVAL from episodes.ts = 30 minutes
const POLL_INTERVAL_MS = 1000 * 60 * 30;
const STALE = Date.now() - POLL_INTERVAL_MS - 1000; // just past threshold
const FRESH = Date.now(); // fetched just now

// ---- factories ----

function podcastData(podcastId: string, overrides: Record<string, unknown> = {}) {
  return {
    podcastId,
    feedUrl: `https://example.com/${podcastId}/feed.xml`,
    title: `Podcast ${podcastId}`,
    author: 'Test Author',
    ownerName: 'Test Owner',
    description: `Description for ${podcastId}`,
    imageUrl: null,
    itunesId: null,
    lastFetchedAt: STALE,
    ...overrides,
  };
}

function episodeData(
  episodeId: string,
  podcastId: string,
  publishedAt: number,
  overrides: Record<string, unknown> = {}
) {
  return {
    episodeId,
    podcastId,
    title: `Episode ${episodeId}`,
    podcastTitle: `Podcast ${podcastId}`,
    publishedAt,
    audioUrl: `https://example.com/${episodeId}.mp3`,
    image: null,
    durationSeconds: 3600,
    sizeBytes: null,
    feedUrl: null,
    feedImage: null,
    feedItunesId: null,
    summary: 'A great episode',
    enclosureType: 'audio/mpeg',
    explicit: false,
    language: 'en',
    retrievedAt: Date.now(),
    ...overrides,
  };
}

// ---- unauthedRecentEpisodes ----

describe('episodes.unauthedRecentEpisodes', () => {
  it('returns empty array when there are no episodes', async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.episodes.unauthedRecentEpisodes);
    expect(result).toEqual([]);
  });

  it('returns episodes ordered by publishedAt descending', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1', 'pod-1', now - 3000));
      await ctx.db.insert('episodes', episodeData('ep-2', 'pod-1', now - 1000));
      await ctx.db.insert('episodes', episodeData('ep-3', 'pod-1', now - 2000));
    });

    const result = await t.query(api.episodes.unauthedRecentEpisodes);

    expect(result).toHaveLength(3);
    expect(result[0].episodeId).toBe('ep-2');
    expect(result[1].episodeId).toBe('ep-3');
    expect(result[2].episodeId).toBe('ep-1');
  });

  it('respects the limit parameter', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert('episodes', episodeData(`ep-${i}`, 'pod-1', now - i * 1000));
      }
    });

    const result = await t.query(api.episodes.unauthedRecentEpisodes, { limit: 3 });
    expect(result).toHaveLength(3);
  });
});

// ---- getRecentFeed ----

describe('episodes.getRecentFeed', () => {
  it('returns empty items and null cursor when user has no subscriptions', async () => {
    const t = convexTest(schema, modules);

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, {});

    expect(result).toEqual({ items: [], cursor: null });
  });

  it('returns episodes from subscribed podcasts sorted by publishedAt desc', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1'));

      await ctx.db.insert('subscriptions', {
        clerkId: 'clerk_user_1',
        podcastId: 'pod-1',
        podConvexId: podId,
        itunesId: null,
        subscribedAt: Date.now(),
        autoDownload: false,
        notificationNew: false,
      });

      await ctx.db.insert('episodes', episodeData('ep-1', 'pod-1', now - 2000));
      await ctx.db.insert('episodes', episodeData('ep-2', 'pod-1', now - 1000));
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, {});

    expect(result.items).toHaveLength(2);
    expect(result.items[0].episodeId).toBe('ep-2');
    expect(result.items[1].episodeId).toBe('ep-1');
  });

  it('does not include episodes from podcasts the user is not subscribed to', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1'));

      await ctx.db.insert('subscriptions', {
        clerkId: 'clerk_user_1',
        podcastId: 'pod-1',
        podConvexId: podId,
        itunesId: null,
        subscribedAt: Date.now(),
        autoDownload: false,
        notificationNew: false,
      });

      await ctx.db.insert('episodes', episodeData('ep-subscribed', 'pod-1', now));
      await ctx.db.insert('episodes', episodeData('ep-unsubscribed', 'pod-2', now));
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, {});

    const ids = result.items.map((e) => e.episodeId);
    expect(ids).toContain('ep-subscribed');
    expect(ids).not.toContain('ep-unsubscribed');
  });

  it('merges and sorts episodes from multiple subscribed podcasts', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      const pod1Id = await ctx.db.insert('podcasts', podcastData('pod-1'));
      const pod2Id = await ctx.db.insert('podcasts', podcastData('pod-2'));

      for (const [podId, convexId] of [
        ['pod-1', pod1Id],
        ['pod-2', pod2Id],
      ] as const) {
        await ctx.db.insert('subscriptions', {
          clerkId: 'clerk_user_1',
          podcastId: podId,
          podConvexId: convexId,
          itunesId: null,
          subscribedAt: Date.now(),
          autoDownload: false,
          notificationNew: false,
        });
      }

      // Interleaved publish times
      await ctx.db.insert('episodes', episodeData('pod1-ep-old', 'pod-1', now - 3000));
      await ctx.db.insert('episodes', episodeData('pod2-ep-newest', 'pod-2', now - 500));
      await ctx.db.insert('episodes', episodeData('pod1-ep-new', 'pod-1', now - 1000));
      await ctx.db.insert('episodes', episodeData('pod2-ep-old', 'pod-2', now - 2000));
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, { pageSize: 10 });

    const ids = result.items.map((e) => e.episodeId);
    expect(ids[0]).toBe('pod2-ep-newest');
    expect(ids[1]).toBe('pod1-ep-new');
    expect(ids[2]).toBe('pod2-ep-old');
    expect(ids[3]).toBe('pod1-ep-old');
  });

  it('respects pageSize', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1'));

      await ctx.db.insert('subscriptions', {
        clerkId: 'clerk_user_1',
        podcastId: 'pod-1',
        podConvexId: podId,
        itunesId: null,
        subscribedAt: Date.now(),
        autoDownload: false,
        notificationNew: false,
      });

      for (let i = 0; i < 5; i++) {
        await ctx.db.insert('episodes', episodeData(`ep-${i}`, 'pod-1', now - i * 1000));
      }
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, { pageSize: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.cursor).not.toBeNull();
  });

  it('paginates using cursor to get the next page', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1'));

      await ctx.db.insert('subscriptions', {
        clerkId: 'clerk_user_1',
        podcastId: 'pod-1',
        podConvexId: podId,
        itunesId: null,
        subscribedAt: Date.now(),
        autoDownload: false,
        notificationNew: false,
      });

      for (let i = 0; i < 4; i++) {
        await ctx.db.insert('episodes', episodeData(`ep-${i}`, 'pod-1', now - i * 1000));
      }
    });

    const page1 = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, { pageSize: 2 });

    expect(page1.items).toHaveLength(2);
    expect(page1.cursor).not.toBeNull();

    const page2 = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.episodes.getRecentFeed, { pageSize: 2, cursor: page1.cursor });

    expect(page2.items).toHaveLength(2);
    // No overlap between pages
    const page1Ids = new Set(page1.items.map((e) => e.episodeId));
    for (const ep of page2.items) {
      expect(page1Ids.has(ep.episodeId)).toBe(false);
    }
  });
});

// ---- fetchPodcastForRefresh ----

describe('episodes.fetchPodcastForRefresh (internalQuery)', () => {
  it('returns empty when there are no subscriptions', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('podcasts', podcastData('pod-1', { lastFetchedAt: STALE }));
    });

    const result = await t.query(internal.episodes.fetchPodcastForRefresh);
    expect(result).toHaveLength(0);
  });

  it('excludes podcasts that were recently fetched', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1', { lastFetchedAt: FRESH }));
      await ctx.db.insert('subscriptions', {
        clerkId: 'clerk_user_1',
        podcastId: 'pod-1',
        podConvexId: podId,
        itunesId: null,
        subscribedAt: Date.now(),
        autoDownload: false,
        notificationNew: false,
      });
    });

    const result = await t.query(internal.episodes.fetchPodcastForRefresh);
    expect(result).toHaveLength(0);
  });

  it('includes stale subscribed podcasts', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1', { lastFetchedAt: STALE }));
      await ctx.db.insert('subscriptions', {
        clerkId: 'clerk_user_1',
        podcastId: 'pod-1',
        podConvexId: podId,
        itunesId: null,
        subscribedAt: Date.now(),
        autoDownload: false,
        notificationNew: false,
      });
    });

    const result = await t.query(internal.episodes.fetchPodcastForRefresh);
    expect(result).toHaveLength(1);
    expect(result[0].podcastId).toBe('pod-1');
  });

  it('only includes uniquely subscribed podcasts', async () => {
    const t = convexTest(schema, modules);

    // Two users subscribed to the same podcast → should appear only once
    await t.run(async (ctx) => {
      const podId = await ctx.db.insert('podcasts', podcastData('pod-1', { lastFetchedAt: STALE }));
      for (const clerkId of ['clerk_user_1', 'clerk_user_2']) {
        await ctx.db.insert('subscriptions', {
          clerkId,
          podcastId: 'pod-1',
          podConvexId: podId,
          itunesId: null,
          subscribedAt: Date.now(),
          autoDownload: false,
          notificationNew: false,
        });
      }
    });

    const result = await t.query(internal.episodes.fetchPodcastForRefresh);
    expect(result).toHaveLength(1);
  });
});

// ---- updateEpisode ----

describe('episodes.updateEpisode (internalMutation)', () => {
  it('updates LLM-computed fields on an episode', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1', 'pod-1', now));
    });

    await t.mutation(internal.episodes.updateEpisode, {
      episodeId: 'ep-1',
      updates: {
        summaryTitle: 'Great Interview',
        oneSentenceSummary: 'A fascinating conversation.',
        keyTopics: ['AI', 'coding'],
      },
    });

    const updated = await t.query(api.episodes.getByGuid, { id: 'ep-1' });
    expect(updated?.summaryTitle).toBe('Great Interview');
    expect(updated?.oneSentenceSummary).toBe('A fascinating conversation.');
    expect(updated?.keyTopics).toEqual(['AI', 'coding']);
  });

  it('throws when episode is not found', async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(internal.episodes.updateEpisode, {
        episodeId: 'nonexistent',
        updates: { summaryTitle: 'should fail' },
      })
    ).rejects.toThrow('episode not found');
  });

  it('applies partial updates without touching other fields', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', {
        ...episodeData('ep-1', 'pod-1', now),
        summaryTitle: 'Original Title',
      });
    });

    await t.mutation(internal.episodes.updateEpisode, {
      episodeId: 'ep-1',
      updates: { oneSentenceSummary: 'Updated summary.' },
    });

    const updated = await t.query(api.episodes.getByGuid, { id: 'ep-1' });
    expect(updated?.summaryTitle).toBe('Original Title');
    expect(updated?.oneSentenceSummary).toBe('Updated summary.');
  });
});
