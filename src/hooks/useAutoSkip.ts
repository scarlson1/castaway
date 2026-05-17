import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useEffect, useMemo, useRef } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';
import { usePlayerSettings } from '~/hooks/usePlayerSettings';
import { useTones } from '~/hooks/useTones';

interface UseAutoSkipProps {
  episodeId: string;
  seek: (t: number) => void;
}

export const useAutoSkip = ({ episodeId, seek }: UseAutoSkipProps) => {
  const position = useAudioStore((s) => s.position);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const autoSkipAds = usePlayerSettings((s) => s.autoSkipAds);
  const { playWarningTone, playSkipTone } = useTones();

  const { data: adsData } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId })
  );

  const ads = useMemo(
    () => [...(adsData ?? [])].sort((a, b) => a.start - b.start),
    [adsData]
  );

  const warnedRef = useRef<Set<string>>(new Set());
  const skippedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    warnedRef.current = new Set();
    skippedRef.current = new Set();
  }, [episodeId]);

  useEffect(() => {
    if (!autoSkipAds || !isPlaying || !ads.length) return;

    for (const ad of ads) {
      const key = `${ad.start}-${ad.end}`;
      const timeToStart = ad.start - position;

      if (timeToStart > 0 && timeToStart <= 5 && !warnedRef.current.has(key)) {
        warnedRef.current.add(key);
        playWarningTone();
      }

      if (position >= ad.start && position < ad.end && !skippedRef.current.has(key)) {
        skippedRef.current.add(key);
        playSkipTone();
        seek(ad.end);
        break;
      }
    }
  }, [position, ads, autoSkipAds, isPlaying, seek, playWarningTone, playSkipTone]);
};
