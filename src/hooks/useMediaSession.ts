import { useEffect } from 'react';

// interface MediaSessionMetadata {
//   title: string;
//   artist: string;
//   album?: string;
//   artwork?: string; // image URL
// }

interface MediaSessionOptions {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  position: number;
  duration: number;
  rate: number;
}

export function useMediaSession({
  title,
  artist,
  album,
  artwork,
  play,
  pause,
  seek,
  position,
  duration,
  rate,
}: MediaSessionOptions) {
  // bug: useAudioPlayer stores howl in a ref --> creates new instance
  // need to use singleton
  // const { seek, play, pause, position, duration, rate } = useAudioPlayer();

  // Set metadata (title, artist, artwork in Now Playing bar)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: artwork
        ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }, [title, artist, album, artwork]);

  // Register action handlers (seek forward/backward, play/pause)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const SKIP_SECONDS = 30;

    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      seek(Math.max(0, position - (details.seekOffset ?? SKIP_SECONDS)));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      seek(position + (details.seekOffset ?? SKIP_SECONDS));
    });
    // Optional: scrubbing via the OS progress bar
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });

    return () => {
      (
        [
          'play',
          'pause',
          'seekbackward',
          'seekforward',
          'seekto',
        ] as MediaSessionAction[]
      ).forEach((action) =>
        navigator.mediaSession.setActionHandler(action, null),
      );
    };
  }, [seek, play, pause, position]); // position needed so seek offset is current

  // Keep the OS progress bar in sync
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: rate,
      position,
    });
  }, [position, duration, rate]);
}
