import { convexTest } from 'convex-test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, internal } from '../_generated/api';
import schema from '../schema';

const modules = import.meta.glob('../**/*.*s');

// ---- helpers ----

const podBase = {
  feedUrl: 'https://example.com/feed.xml',
  title: 'Test Podcast',
  author: 'Test Author',
  ownerName: 'Test Owner',
  description: 'A test podcast',
  imageUrl: null,
  itunesId: null,
  lastFetchedAt: Date.now(),
};

// ---- tests ----

describe('subscribe.all', () => {
  it('returns empty array for unauthenticated user', async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.subscribe.all);
    expect(result).toEqual([]);
  });

  it('returns subscriptions for authenticated user', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.all);

    expect(result).toHaveLength(1);
    expect(result[0].podcastId).toBe('pod-1');
    expect(result[0].clerkId).toBe('clerk_user_1');
  });

  it('only returns subscriptions for the requesting user', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    // user 1 subscribes
    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    // user 2 sees no subs
    const result = await t
      .withIdentity({ subject: 'clerk_user_2' })
      .query(api.subscribe.all);

    expect(result).toHaveLength(0);
  });
});

describe('subscribe.isFollowing', () => {
  it('returns false when user is not subscribed', async () => {
    const t = convexTest(schema, modules);
    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.isFollowing, { podId: 'pod-1' });
    expect(result).toBe(false);
  });

  it('returns true after subscribing', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.isFollowing, { podId: 'pod-1' });

    expect(result).toBe(true);
  });

  it('returns false for a different pod the user is not following', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.isFollowing, { podId: 'pod-2' });

    expect(result).toBe(false);
  });
});

describe('subscribe.add (internalMutation)', () => {
  it('creates a subscription and returns success', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: 12345,
      });

    expect(result.success).toBe(true);
    expect(result.alreadySubscribed).toBe(false);
    expect(result.id).toBeDefined();
  });

  it('is idempotent — returns alreadySubscribed=true on duplicate', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    expect(result.success).toBe(true);
    expect(result.alreadySubscribed).toBe(true);

    // still only one record in DB
    const subs = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.all);
    expect(subs).toHaveLength(1);
  });

  it('defaults autoDownload and notificationNew to false', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    const subs = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.all);

    expect(subs[0].autoDownload).toBe(false);
    expect(subs[0].notificationNew).toBe(false);
  });
});

describe('subscribe.remove', () => {
  it('removes a subscription', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.subscribe.remove, { podId: 'pod-1' });

    const subs = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.all);

    expect(subs).toHaveLength(0);
  });

  it('throws when subscription does not exist', async () => {
    const t = convexTest(schema, modules);

    await expect(
      t
        .withIdentity({ subject: 'clerk_user_1' })
        .mutation(api.subscribe.remove, { podId: 'pod-1' })
    ).rejects.toThrow('subscription not found');
  });
});

describe('subscribe.update', () => {
  it('updates subscription settings', async () => {
    const t = convexTest(schema, modules);

    const podConvexId = await t.run((ctx) =>
      ctx.db.insert('podcasts', { ...podBase, podcastId: 'pod-1' })
    );

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(internal.subscribe.add, {
        podId: 'pod-1',
        podConvexId,
        itunesId: null,
      });

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.subscribe.update, {
        podId: 'pod-1',
        updates: { autoDownload: true, notificationNew: true },
      });

    const subs = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.subscribe.all);

    expect(subs[0].autoDownload).toBe(true);
    expect(subs[0].notificationNew).toBe(true);
  });

  it('throws when subscription does not exist', async () => {
    const t = convexTest(schema, modules);

    await expect(
      t
        .withIdentity({ subject: 'clerk_user_1' })
        .mutation(api.subscribe.update, {
          podId: 'pod-1',
          updates: { autoDownload: true },
        })
    ).rejects.toThrow('subscription not found');
  });
});
