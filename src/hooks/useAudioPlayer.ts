import { Howl } from 'howler';
import { useEffect, useRef } from 'react';
import { useAudioStore } from './useAudioStoreGPT';

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

  // Load / reload audio when URL changes
  useEffect(() => {
    if (!audioUrl) return;

    // Destroy existing instance
    if (howlRef.current) {
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
    });

    howlRef.current = howl;

    // Restore last position
    howl.once('load', () => {
      if (position > 0) {
        howl.seek(position);
      }
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

  return {
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying(!isPlaying),

    seek: (seconds: number) => {
      const howl = howlRef.current;
      if (!howl) return;
      howl.seek(seconds);
      setPosition(seconds);
    },

    setVolume,
    position,
    volume,
    isPlaying,

    duration: howlRef.current?.duration() ?? 0,
  };
}
