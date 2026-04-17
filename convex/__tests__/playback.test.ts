import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';

const modules = import.meta.glob('../**/*.*s');

// ---- factories ----

function episodeData(episodeId: string, podcastId = 'pod-1') {
  return {
    episodeId,
    podcastId,
    title: `Episode ${episodeId}`,
    podcastTitle: 'Test Podcast',
    publishedAt: Date.now(),
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
  };
}

// ---- getByEpisodeId ----

describe('playback.getByEpisodeId', () => {
  it('returns null when the user is not authenticated', async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });
    expect(result).toBeNull();
  });

  it('returns null when no playback record exists for the episode', async () => {
    const t = convexTest(schema, modules);
    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });
    expect(result).toBeNull();
  });

  it('returns the playback record when it exists', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-1',
        podcastId: 'pod-1',
        positionSeconds: 120,
        completed: false,
        lastUpdatedAt: Date.now(),
      });
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });

    expect(result).not.toBeNull();
    expect(result?.episodeId).toBe('ep-1');
    expect(result?.positionSeconds).toBe(120);
  });

  it('does not return another user\'s playback', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_2',
        episodeId: 'ep-1',
        podcastId: 'pod-1',
        positionSeconds: 300,
        completed: false,
        lastUpdatedAt: Date.now(),
      });
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });

    expect(result).toBeNull();
  });
});

// ---- getAllForUser ----

describe('playback.getAllForUser', () => {
  it('returns empty array when not authenticated', async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.playback.getAllForUser);
    expect(result).toEqual([]);
  });

  it('returns empty array when user has no playback records', async () => {
    const t = convexTest(schema, modules);
    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getAllForUser);
    expect(result).toEqual([]);
  });

  it('returns all playback records for the user', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-1',
        podcastId: 'pod-1',
        positionSeconds: 60,
        completed: false,
        lastUpdatedAt: now - 2000,
      });
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-2',
        podcastId: 'pod-1',
        positionSeconds: 180,
        completed: true,
        lastUpdatedAt: now - 1000,
      });
      // another user's record — should not appear
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_2',
        episodeId: 'ep-3',
        podcastId: 'pod-1',
        positionSeconds: 30,
        completed: false,
        lastUpdatedAt: now,
      });
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getAllForUser);

    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.episodeId);
    expect(ids).toContain('ep-1');
    expect(ids).toContain('ep-2');
    expect(ids).not.toContain('ep-3');
  });
});

// ---- update ----

describe('playback.update', () => {
  it('creates a new playback record when none exists', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1'));
    });

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.playback.update, {
        episodeId: 'ep-1',
        positionSeconds: 90,
      });

    const record = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });

    expect(record).not.toBeNull();
    expect(record?.positionSeconds).toBe(90);
    expect(record?.completed).toBe(false);
    expect(record?.clerkId).toBe('clerk_user_1');
  });

  it('updates position on an existing playback record', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1'));
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-1',
        podcastId: 'pod-1',
        positionSeconds: 60,
        completed: false,
        lastUpdatedAt: Date.now() - 5000,
      });
    });

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.playback.update, {
        episodeId: 'ep-1',
        positionSeconds: 300,
      });

    const record = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });

    expect(record?.positionSeconds).toBe(300);
  });

  it('marks episode as completed when completed=true', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1'));
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-1',
        podcastId: 'pod-1',
        positionSeconds: 3500,
        completed: false,
        lastUpdatedAt: Date.now() - 1000,
      });
    });

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.playback.update, {
        episodeId: 'ep-1',
        positionSeconds: 3600,
        completed: true,
      });

    const record = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });

    expect(record?.completed).toBe(true);
  });

  it('calculates playedPercentage when duration is known on an existing record', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1'));
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-1',
        podcastId: 'pod-1',
        positionSeconds: 0,
        duration: 1000,
        completed: false,
        lastUpdatedAt: Date.now() - 1000,
      });
    });

    await t
      .withIdentity({ subject: 'clerk_user_1' })
      .mutation(api.playback.update, {
        episodeId: 'ep-1',
        positionSeconds: 500,
      });

    const record = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.getByEpisodeId, { episodeId: 'ep-1' });

    // getPlayedPct: round((1 - (1000 - 500) / 1000) * 100) / 100 = 0.5
    expect(record?.playedPercentage).toBe(0.5);
  });

  it('does nothing when the user is not authenticated', async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert('episodes', episodeData('ep-1'));
    });

    // unauthenticated call — should return without throwing
    await t.mutation(api.playback.update, {
      episodeId: 'ep-1',
      positionSeconds: 100,
    });

    // no record created
    const records = await t.run(async (ctx) =>
      ctx.db.query('user_playback').collect()
    );
    expect(records).toHaveLength(0);
  });
});

// ---- lastListened ----

describe('playback.lastListened', () => {
  it('returns null when not authenticated', async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.playback.lastListened);
    expect(result).toBeNull();
  });

  it('returns null when user has no playback records', async () => {
    const t = convexTest(schema, modules);
    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.lastListened);
    expect(result).toBeNull();
  });

  it('returns the most recently updated playback record', async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-old',
        podcastId: 'pod-1',
        positionSeconds: 60,
        completed: false,
        lastUpdatedAt: now - 5000,
      });
      await ctx.db.insert('user_playback', {
        clerkId: 'clerk_user_1',
        episodeId: 'ep-recent',
        podcastId: 'pod-1',
        positionSeconds: 120,
        completed: false,
        lastUpdatedAt: now - 1000,
      });
    });

    const result = await t
      .withIdentity({ subject: 'clerk_user_1' })
      .query(api.playback.lastListened);

    expect(result?.episodeId).toBe('ep-recent');
  });
});
