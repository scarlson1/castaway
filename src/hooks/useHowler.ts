import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Howl } from 'howler';
import { debounce } from 'lodash-es';
import { useCallback, useEffect, useRef, useState } from 'react';
// import { debounce } from "lodash";

// move volume to context - can access global via Howler.volume(0.5) ??
// move to context --> share state with volume component, etc. or pass as props ??
// zustand ??

// TODO: add offline support
// TODO: sync with localstorage/db/analytics for playback position, etc.

interface Episode {
  id: string;
  audioUrl: string;
  durationSeconds?: number;
  title?: string;
}

interface UseHowlerOptions {
  onEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onPlayError?: (err: Error) => void;
  onLoadError?: (err: Error) => void;
}

// does convex subscription for initial value cause loop ?? use function to set position ??
// can audio be run in separate thread to avoid interruption when navigating / loading page ??

export const useHowler = (
  { id, audioUrl, durationSeconds = 0, title }: Episode,
  { onEnd, onPlay, onPause, onPlayError, onLoadError }: UseHowlerOptions = {},
  savedPosition = 0
) => {
  const howlRef = useRef<Howl>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(durationSeconds);
  const [position, setPosition] = useState(savedPosition);
  const [volume, setVolume] = useState(0.5); // 0 to 1
  const [rate, setRate] = useState(1);

  // convex optimistic update: https://tanstack.com/start/latest/docs/framework/react/examples/start-convex-trellaux?path=examples%2Freact%2Fstart-convex-trellaux%2Fsrc%2Fqueries.ts
  // // Example Convex mutation wrapper (via TanStack Query)
  // disable if not authenticated ?? anonymous auth ??
  const { mutate: updatePlayback, isPending } = useMutation({
    mutationFn: useConvexMutation(api.playback.update),
  });

  useEffect(() => {
    console.log(`mutation pending: ${isPending}`);
  }, [isPending]);

  // const updatePlayback = useMutation({
  //   mutationFn: async ({ position }) => {
  //     await fetch("/api/updatePlayback", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         episodeId: id,
  //         positionSeconds: position,
  //       }),
  //     });
  //   },
  // });

  // // TODO: use useDebounce hook (useLayoutEffect ??)
  // https://usehooks-ts.com/react-hook/use-debounce-callback
  // https://usehooks-ts.com/react-hook/use-debounce-value
  // https://github.com/uidotdev/usehooks/blob/945436df0037bc21133379a5e13f1bd73f1ffc36/index.js#L239
  // Debounced persist
  const persistProgress = useRef(
    debounce((pos) => {
      updatePlayback({ positionSeconds: pos, episodeId: id });
    }, 5000)
  ).current;

  // Initialize Howler sound
  useEffect(() => {
    if (!audioUrl) return;

    const sound = new Howl({
      src: [audioUrl],
      html5: true, // allows streaming large files (play before download complete)
      // preload: 'metadata', // need to call load() if not set to true ??
      autoplay: true,
      volume,
      onload: () => {
        setDuration(sound.duration());
        // setLoaded(true) // TODO: add loaded state ?? useful for enabling play button, etc.
      },
      onplay: () => {
        setIsPlaying(true);
        onPlay?.();
      },
      onpause: () => {
        setIsPlaying(false);
        onPause?.();
      },
      onend: () => {
        setIsPlaying(false);
        setPosition(duration);
        // persistProgress(duration)
        onEnd?.();
      },
      // onmute: () => {},
      // onvolume: () => {},
      onrate: (id, rest) => {
        console.log(`rate change ${id}`, rest);
      },
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

    howlRef.current = sound;

    // Start at saved position
    sound.once('load', () => {
      if (savedPosition > 0 && savedPosition < sound.duration()) {
        sound.seek(savedPosition);
      }
    });

    return () => {
      sound.unload();
      persistProgress.cancel();
    };
  }, [audioUrl]);

  // Track position (updates every 500ms while playing)
  // useInterval(() => {
  //   if (isPlaying) {
  //     const sound = howlRef.current;
  //     if (sound) setPosition(sound.seek());
  //   }
  // }, 500);

  // Poll for current seek position while playing
  useEffect(() => {
    let raf;
    const update = () => {
      const sound = howlRef.current;
      if (sound && sound.playing()) {
        const current = sound.seek() as number;
        setPosition(current);
        persistProgress(current);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);

    return () => cancelAnimationFrame(raf);
  }, [persistProgress]);

  // Playback controls
  const play = useCallback(() => howlRef.current?.play(), []);

  const pause = useCallback(() => howlRef.current?.pause(), []);

  const stop = useCallback(() => {
    howlRef.current?.stop();
    setIsPlaying(false);
    setPosition(0);
  }, []);

  const mute = useCallback(() => howlRef.current?.mute(), []);

  const seek = useCallback(
    (pos: number) => {
      const sound = howlRef.current;
      if (sound && typeof pos === 'number') {
        sound.seek(pos);
        setPosition(pos);
        persistProgress(pos);
      }
    },
    [persistProgress]
  );

  const setVol = useCallback((v) => {
    const sound = howlRef.current;
    if (sound) {
      sound.volume(v);
      setVolume(v);
    }
  }, []);

  const handleSetRate = useCallback((r: number) => {
    const sound = howlRef.current;
    if (sound && r > 0.5 && r < 4) {
      sound.rate(r);
      setRate(r);
    }
  }, []);

  return {
    play,
    pause,
    stop,
    seek,
    mute,
    setVol,
    setRate: handleSetRate,
    isPlaying,
    duration,
    position,
    volume,
    // rate: () => howlRef.current?.rate() || 1,
    rate,
  };
};
