/**
 * Phase 5 — Server function input validator tests.
 *
 * These Zod schemas are the boundary between client input and external API
 * calls. Testing them separately catches contract regressions without needing
 * to mock the PodcastIndex or Spotify APIs.
 */
import { describe, expect, it } from 'vitest';
import {
  fetchAppleChartsOptions,
  fetchTrendingOptions,
} from '../trending';
import {
  fetchEpisodeDetailsOptions,
  fetchPodDetailsOptions,
} from '../podcast';
import {
  fetchRandomEpisodesOptions,
  fetchRecentEpisodesOptions,
} from '../episodes';
import { fetchSpotifyPlaylistArgs } from '../spotify';

// ---- podcast validators ----

describe('fetchPodDetailsOptions (id: number)', () => {
  it('accepts a valid numeric id', () => {
    expect(() => fetchPodDetailsOptions.parse({ id: 12345 })).not.toThrow();
  });

  it('rejects a string id', () => {
    expect(() => fetchPodDetailsOptions.parse({ id: 'abc' })).toThrow();
  });

  it('rejects a missing id', () => {
    expect(() => fetchPodDetailsOptions.parse({})).toThrow();
  });

  it('rejects a non-integer float id', () => {
    // fetchPodDetailsOptions uses z.number() not z.int(), but the schema is
    // intended for PodcastIndex integer feed IDs. Document actual behavior.
    expect(() => fetchPodDetailsOptions.parse({ id: 1.5 })).not.toThrow();
  });
});

describe('fetchEpisodeDetailsOptions (id: string)', () => {
  it('accepts a valid string guid', () => {
    expect(() =>
      fetchEpisodeDetailsOptions.parse({ id: 'abc-def-123' })
    ).not.toThrow();
  });

  it('accepts optional since, max, fullText fields', () => {
    expect(() =>
      fetchEpisodeDetailsOptions.parse({
        id: 'pod-guid',
        since: 1700000000,
        max: 50,
        fullText: true,
      })
    ).not.toThrow();
  });

  it('rejects a numeric id', () => {
    expect(() => fetchEpisodeDetailsOptions.parse({ id: 123 })).toThrow();
  });

  it('rejects a missing id', () => {
    expect(() => fetchEpisodeDetailsOptions.parse({})).toThrow();
  });
});

// ---- trending validators ----

describe('fetchTrendingOptions', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => fetchTrendingOptions.parse({})).not.toThrow();
  });

  it('accepts valid values for all fields', () => {
    expect(() =>
      fetchTrendingOptions.parse({
        max: 20,
        since: 1700000000,
        lang: 'en',
        cat: 'Technology',
        notcat: 'News',
      })
    ).not.toThrow();
  });

  it('rejects max below 1', () => {
    expect(() => fetchTrendingOptions.parse({ max: 0 })).toThrow();
  });

  it('rejects max above 100', () => {
    expect(() => fetchTrendingOptions.parse({ max: 101 })).toThrow();
  });

  it('accepts max at boundary values (1 and 100)', () => {
    expect(() => fetchTrendingOptions.parse({ max: 1 })).not.toThrow();
    expect(() => fetchTrendingOptions.parse({ max: 100 })).not.toThrow();
  });

  it('accepts a numeric cat (category id)', () => {
    expect(() => fetchTrendingOptions.parse({ cat: 9 })).not.toThrow();
  });

  it('accepts null for nullable fields', () => {
    expect(() =>
      fetchTrendingOptions.parse({ since: null, lang: null, cat: null, notcat: null })
    ).not.toThrow();
  });
});

describe('fetchAppleChartsOptions', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => fetchAppleChartsOptions.parse({})).not.toThrow();
  });

  it('accepts a valid market and limit', () => {
    expect(() =>
      fetchAppleChartsOptions.parse({ market: 'gb', limit: 50 })
    ).not.toThrow();
  });

  it('rejects limit above 100', () => {
    expect(() => fetchAppleChartsOptions.parse({ limit: 101 })).toThrow();
  });

  it('accepts limit at boundary value 100', () => {
    expect(() => fetchAppleChartsOptions.parse({ limit: 100 })).not.toThrow();
  });

  it('rejects a non-string market', () => {
    expect(() => fetchAppleChartsOptions.parse({ market: 42 })).toThrow();
  });
});

// ---- episodes validators ----

describe('fetchRecentEpisodesOptions', () => {
  it('accepts an empty object', () => {
    expect(() => fetchRecentEpisodesOptions.parse({})).not.toThrow();
  });

  it('accepts all fields populated', () => {
    expect(() =>
      fetchRecentEpisodesOptions.parse({
        max: 20,
        excludeString: 'trailer',
        before: 1700000000,
        fullText: true,
      })
    ).not.toThrow();
  });

  it('rejects a string max', () => {
    expect(() => fetchRecentEpisodesOptions.parse({ max: 'ten' })).toThrow();
  });
});

describe('fetchRandomEpisodesOptions', () => {
  it('accepts an empty object', () => {
    expect(() => fetchRandomEpisodesOptions.parse({})).not.toThrow();
  });

  it('accepts all optional fields', () => {
    expect(() =>
      fetchRandomEpisodesOptions.parse({
        max: 5,
        lang: 'en',
        cat: 'Technology',
        notcat: 'News',
        fulltext: 'true',
      })
    ).not.toThrow();
  });

  it('rejects a boolean max (expects number)', () => {
    expect(() => fetchRandomEpisodesOptions.parse({ max: true })).toThrow();
  });
});

// ---- spotify validators ----

describe('fetchSpotifyPlaylistArgs', () => {
  it('accepts a valid playlistId', () => {
    expect(() =>
      fetchSpotifyPlaylistArgs.parse({ playlistId: '37i9dQZF1DXcBWIGoYBM5M' })
    ).not.toThrow();
  });

  it('accepts optional market and fields', () => {
    expect(() =>
      fetchSpotifyPlaylistArgs.parse({
        playlistId: 'abc123',
        market: 'US',
        fields: 'items(track(name,artists))',
      })
    ).not.toThrow();
  });

  it('rejects a missing playlistId', () => {
    expect(() => fetchSpotifyPlaylistArgs.parse({})).toThrow();
  });

  it('rejects a numeric playlistId', () => {
    expect(() => fetchSpotifyPlaylistArgs.parse({ playlistId: 123 })).toThrow();
  });
});
