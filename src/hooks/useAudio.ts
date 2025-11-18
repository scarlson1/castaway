import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { throttle } from 'lodash-es';
import { useEffect, useRef } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useClerkAuth } from '~/hooks/useClerkAuth';
import { useInterval } from '~/hooks/useInterval';

// zustand:
// - store howler position/state in localstorage

// hook:
// - sync playback db

// TODO: handle hydration (use db playback on initial render ??)

interface Episode {
  id: string;
  audioUrl: string;
  durationSeconds?: number;
  title?: string;
}

interface UseAudioOptions {
  onEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoad?: () => void;
  onPlayError?: (err: Error) => void;
  onLoadError?: (err: Error) => void;
}

export const useAudio = (
  { id, audioUrl, durationSeconds = 0, title }: Episode,
  {
    onEnd,
    onPlay,
    onPause,
    onLoad,
    onPlayError,
    onLoadError,
  }: UseAudioOptions = {},
  savedPosition // = 0
) => {
  const { isAuthenticated } = useClerkAuth();
  const {
    position,
    isPlaying,
    sound,
    volume,
    rate,
    duration,
    load,
    tick,
    play,
    pause,
    seek,
    setRate,
    setVolume,
  } = useAudioStore();
  // const isPlaying = useAudioStore((s) => s.isPlaying);
  // or use request animation frame ??

  // convex optimistic update: https://tanstack.com/start/latest/docs/framework/react/examples/start-convex-trellaux?path=examples%2Freact%2Fstart-convex-trellaux%2Fsrc%2Fqueries.ts
  // disable if not authenticated ?? anonymous auth ??
  const { mutate: updatePlayback } = useMutation({
    mutationFn: useConvexMutation(api.playback.update),
  });

  useInterval(tick, 100);
  // useInterval(() => {
  //   if (sound?.playing())
  //     updatePlayback({
  //       episodeId: id,
  //       positionSeconds: position,
  //       completed: Boolean(duration === position),
  //     });
  // }, 2000);

  useEffect(() => {
    if (audioUrl) {
      load(audioUrl, id, { position: savedPosition ?? undefined });
    }
  }, [audioUrl, id, savedPosition, load]);

  const persistProgressRef = useRef<ReturnType<typeof throttle> | null>(null);

  useEffect(() => {
    // cancel previous if exists
    persistProgressRef.current?.cancel();

    // create new debounced function that closes over current id/updatePlayback
    persistProgressRef.current = throttle((pos: number) => {
      // console.log(`update playback: ${title} [epId: ${id}]`);
      updatePlayback({ positionSeconds: pos, episodeId: id });
    }, 5000);

    return () => {
      persistProgressRef.current?.cancel();
    };
  }, [id, updatePlayback]);

  // useAnimationFrame(() => {
  //   console.log('req animation frame cb called');
  //   if (sound && sound.playing()) {
  //     const current = sound.seek() as number;
  //     // setPosition(current);
  //     tick();
  //     persistProgressRef.current?.(current);
  //   }
  // }, 10);

  // Poll for current seek position while playing
  const previousTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (!sound) return;

    let raf: number;
    const update = (currentTime: number) => {
      if (sound?.playing()) {
        const current = sound.seek() as number;

        // tick();
        persistProgressRef.current?.(current);
      }
      previousTimeRef.current = currentTime;
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);

    return () => cancelAnimationFrame(raf);
  }, [tick, sound]); //isAuthenticated

  return {
    play,
    pause,
    stop,
    seek,
    // mute,
    setVolume,
    setRate, // : handleSetRate,
    isPlaying,
    duration,
    position,
    volume,
    // rate: () => howlRef.current?.rate() || 1,
    rate,
  };
};
