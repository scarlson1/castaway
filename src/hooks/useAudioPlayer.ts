import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Howl } from 'howler';
import { useCallback, useEffect, useRef } from 'react';
import { useAudioStore } from './useAudioStore';

// TODO: use howler 'end' event to play next in queue

export function useAudioPlayer() {
  const {
    podcastId,
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
  const isControllingRef = useRef(false);

  const { mutate: updatePlayback } = useMutation({
    mutationFn: useConvexMutation(api.playback.update),
  });

  // periodic sync → Convex
  useEffect(() => {
    if (!episodeId) return;
    const howl = howlRef.current;
    if (!howl) return;

    let lastSent = 0;

    const interval = setInterval(() => {
      if (!howl.playing() || isControllingRef.current) return;

      const pos = howl.seek() as number;
      const isComplete = duration && pos >= duration - 1;

      // Prevent redundant writes
      if (Math.abs(pos - lastSent) < 0.75) return;
      lastSent = pos;

      console.log('updating playback: ', pos);
      updatePlayback({
        episodeId,
        positionSeconds: Math.floor(pos),
        completed: Boolean(isComplete),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [episodeId, duration]);

  // onend → mark completed
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    howl.on('end', () => {
      if (episodeId) {
        updatePlayback({
          episodeId,
          positionSeconds: duration ?? 0,
          completed: true,
        });
      }
    });
  }, [episodeId, duration]);

  // useInterval(
  //   () => {
  //     if (howlRef.current?.playing() && episodeId)
  //       updatePlayback({
  //         episodeId,
  //         positionSeconds: position,
  //         completed: Boolean(duration === position),
  //       });
  //   },
  //   10000 // 10s
  //   // !isPlaying
  // );

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
      onplay: () => {
        if (!isControllingRef.current) {
          setPlaying(true);
        }
      },
      onpause: () => {
        if (!isControllingRef.current) {
          setPlaying(false);
        }
      },
      onstop: () => {
        if (!isControllingRef.current) {
          setPlaying(false);
        }
      },
      onend: () => {
        if (!isControllingRef.current) {
          setPlaying(false);
        }
      },
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

    // Only update if state is out of sync
    const isCurrentlyPlaying = howl.playing();
    if (isPlaying === isCurrentlyPlaying) return;

    isControllingRef.current = true;
    try {
      if (isPlaying) {
        howl.play();
      } else {
        howl.pause();
      }
    } finally {
      // Reset flag after callbacks have a chance to fire
      requestAnimationFrame(() => {
        isControllingRef.current = false;
      });
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

    if (howl.playing() || isPlaying !== howl.playing()) {
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

    podcastId,
    episodeId,
  };
}
