import { Howl } from 'howler';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '~/hooks/useInterval';

// move volume to context - can access global via Howler.volume(0.5) ??
// move to context --> share state with volume component, etc. or pass as props ??
// zustand ??

// TODO: add offline support
// TODO: sync with localstorage/db/analytics for playback position, etc.

interface UseHowlerOptions {
  onEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onPlayError?: (err: Error) => void;
  onLoadError?: (err: Error) => void;
}

export const useHowler = (
  src,
  { onEnd, onPlay, onPause, onPlayError, onLoadError }: UseHowlerOptions = {}
) => {
  const soundRef = useRef<Howl>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(0.5); // 0 to 1

  // Initialize Howler sound
  useEffect(() => {
    if (!src) return;

    const sound = new Howl({
      src: [src],
      html5: true, // allows streaming large files (play before download complete)
      // preload: 'metadata', // need to call load() if not set to true ??
      volume,
      onplay: () => {
        setIsPlaying(true);
        setDuration(sound.duration());
        onPlay?.();
      },
      onpause: () => {
        setIsPlaying(false);
        onPause?.();
      },
      onend: () => {
        setIsPlaying(false);
        onEnd?.();
      },
      // onmute: () => {},
      // onvolume: () => {},
      // onrate: (id) => {
      //   console.log(`rate change ${id}`);
      // },
      // onseek: () => {},
      onunlock: () => {
        console.log(`audio unlocked`);
      },
      onloaderror: (id, err) => {
        console.log('load error: ', err);
        onLoadError?.(err);
      },
      onplayerror: (id, err) => {
        console.log('play error: ', err);
        onPlayError?.(err);
      },
    });

    soundRef.current = sound;

    return () => {
      sound.unload();
    };
  }, [src]);

  // TODO: set in local storage

  // useEffect(() => {
  //   let interval;
  //   if (isPlaying) {
  //     interval = setInterval(() => {
  //       const sound = soundRef.current;
  //       if (sound) setPosition(sound.seek());
  //     }, 500);
  //   }

  //   return () => clearInterval(interval);
  // }, [isPlaying]);

  // Track position (updates every 500ms while playing)
  useInterval(() => {
    if (isPlaying) {
      const sound = soundRef.current;
      if (sound) setPosition(sound.seek());
    }
  }, 500);

  // Playback controls
  const play = useCallback(() => {
    soundRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    soundRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    soundRef.current?.stop();
    setIsPlaying(false);
    setPosition(0);
  }, []);

  const mute = useCallback(() => {
    soundRef.current?.mute();
  }, []);

  const seek = useCallback((newTime) => {
    const sound = soundRef.current;
    if (sound && typeof newTime === 'number') {
      sound.seek(newTime);
      setPosition(newTime);
    }
  }, []);

  const setVol = useCallback((v) => {
    const sound = soundRef.current;
    if (sound) {
      sound.volume(v);
      setVolume(v);
    }
  }, []);

  const setRate = useCallback((r: number) => {
    const sound = soundRef.current;
    if (sound && r > 0.5 && r < 4) {
      sound.rate(r);
      // setRate() // TODO: store in state ??
    }
  }, []);

  return {
    play,
    pause,
    stop,
    seek,
    mute,
    setVol,
    setRate,
    isPlaying,
    duration,
    position,
    volume,
    rate: () => soundRef.current?.rate() || 1,
  };
};
