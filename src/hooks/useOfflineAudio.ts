// use cache storage or indexedDB ??

import { useCallback } from 'react';

const CACHE_NAME = 'castaway-audio-cache-v1'; // use env vars - pass as param??

export function useOfflineAudio(cacheName: string = CACHE_NAME) {
  const downloadEpisode = useCallback(
    async (id: string, url: string) => {
      const cache = await caches.open(cacheName);
      const response = await fetch(url);
      await cache.put(`/audio/${id}`, response);
    },
    [cacheName]
  );

  const getCachedEpisodeUrl = useCallback(
    async (id: string) => {
      const cache = await caches.open(cacheName);
      const match = await cache.match(`/audio/${id}`);
      if (!match) return null;

      // Return an object URL for playback
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    },
    [cacheName]
  );

  const removeEpisode = useCallback(
    async (id: string) => {
      const cache = await caches.open(cacheName);
      await cache.delete(`/audio/${id}`);
    },
    [cacheName]
  );

  const isDownloaded = useCallback(
    async (id: string) => {
      const cache = await caches.open(cacheName);
      const match = await cache.match(`/audio/${id}`);
      return !!match;
    },
    [cacheName]
  );

  return {
    downloadEpisode,
    getCachedEpisodeUrl,
    removeEpisode,
    isDownloaded,
  };
}
