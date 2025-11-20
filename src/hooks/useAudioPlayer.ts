import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Howl } from 'howler';
import { useCallback, useEffect, useRef } from 'react';
import { useInterval } from '~/hooks/useInterval';
import { useAudioStore } from './useAudioStore';

// TODO: use howler 'end' event to play next in queue

export function useAudioPlayer() {
  const {
    episodeId,
    audioUrl,
    isPlaying,
    position,
    volume,
    rate,
    duration,
    setPlaying,
    setPosition,
    setVolume,
    setDuration,
    setRate,
  } = useAudioStore();

  const howlRef = useRef<Howl | null>(null);

  const { mutate: updatePlayback } = useMutation({
    mutationFn: useConvexMutation(api.playback.update),
  });

  useInterval(
    () => {
      if (howlRef.current?.playing() && episodeId)
        updatePlayback({
          episodeId,
          positionSeconds: position,
          completed: Boolean(duration === position),
        });
    },
    10000, // 10s
    !isPlaying
  );

  // Load / reload audio when URL changes
  useEffect(() => {
    if (!audioUrl) return;

    // Destroy existing instance
    if (howlRef.current) {
      if (howlRef.current.src === audioUrl) return;
      howlRef.current.unload();
    }

    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      volume,
      preload: true,
      onplay: () => setPlaying(true),
      onpause: () => setPlaying(false),
      onstop: () => setPlaying(false),
      onend: () => setPlaying(false),
      onload: (v) => console.log('LOAD', v),
    });

    howlRef.current = howl;

    // Restore last position
    howl.once('load', () => {
      if (position > 0) {
        howl.seek(position);
      }
      setPlaying(true);
      setDuration(howl.duration());
    });

    return () => {
      howl.unload();
      howlRef.current = null;
    };
  }, [audioUrl]);

  // Sync isPlaying → Howler
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (isPlaying && !howl.playing()) {
      howl.play();
    } else if (!isPlaying && howl.playing()) {
      howl.pause();
    }
  }, [isPlaying]);

  // Sync volume → Howler
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  // Sync rate → Howler
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.rate(rate);
    }
  }, [rate]);

  // Track position while playing
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    let interval: number | null = null;

    if (howl.playing()) {
      interval = window.setInterval(() => {
        const newPos = howl.seek() as number;
        useAudioStore.getState().setPosition(newPos);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const seek = useCallback((seconds: number) => {
    const howl = howlRef.current;
    if (!howl) return;
    howl.seek(seconds);
    setPosition(seconds);
  }, []);

  return {
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying(!isPlaying),
    seek,

    rate,
    setRate,
    setVolume,
    position,
    volume,
    isPlaying,
    duration: duration ?? 0, // howlRef.current?.duration() ?? 0,

    episodeId,
  };
}
