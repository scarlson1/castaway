import { convexQuery } from '@convex-dev/react-query';
import { Button, Fade } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useCallback, useMemo } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useDebounce } from '~/hooks/useDebounce';

const useDebouncedPosition = (delay = 500) => {
  const position = useAudioStore((s) => s.position);
  return useDebounce(position, delay);
};

interface SkipAdButtonProps {
  episodeId: string;
  seek: (pos: number) => void;
}

export const SkipAdButton = ({ episodeId, seek }: SkipAdButtonProps) => {
  const position = useDebouncedPosition();

  const {
    data: adsData,
    isPending,
    isError,
  } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId })
  );

  // Memoize sorted ads to prevent new array reference on every render
  const ads = useMemo(() => {
    if (!adsData?.length) return [];
    return [...adsData].sort((a, b) => a.start - b.start);
  }, [adsData]);

  const skipAd = useCallback(
    (pos: number) => {
      seek(pos);
    },
    [seek]
  );

  const nextAd = useMemo(() => {
    if (!ads.length) return null;
    return ads.find((a) => a.end > position) || null;
  }, [ads, position]);

  // Memoize the show calculation to prevent rapid toggling
  const { show, timeToNextAd } = useMemo(() => {
    if (!nextAd) return { show: false, timeToNextAd: 0 };
    const timeToNext = nextAd.start - position;
    // const positionIsAd = position >= nextAd.start
    return {
      show: timeToNext < 10,
      timeToNextAd: timeToNext,
    };
  }, [nextAd, position]);

  if (isPending || isError || !ads.length || !nextAd || !show) {
    return null;
  }

  return (
    <Fade in={show} timeout={300}>
      <div>
        <Button onClick={() => skipAd(nextAd.end)}>
          {`skip ad ${
            timeToNextAd > 0 ? Math.ceil(timeToNextAd) + 's' : ''
          }`.trim()}
        </Button>
      </div>
    </Fade>
  );
};
