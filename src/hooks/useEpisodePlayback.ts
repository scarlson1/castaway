import { convexQuery, useConvexAuth } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMemo } from 'react';

export function useEpisodePlayback(episodeId: string) {
  const { isAuthenticated } = useConvexAuth();
  const { data } = useQuery({
    ...convexQuery(api.playback.getAllForUser, {}),
    enabled: isAuthenticated,
  });

  const playback = useMemo(
    () => data?.find((p) => p.episodeId === episodeId) ?? null,
    [episodeId, data]
  );

  return useMemo(() => playback, [playback]);
}
