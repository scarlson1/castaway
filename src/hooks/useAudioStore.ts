import { Howl } from 'howler';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TODO: use original hook with context and useLocalStorage hook (update whenever sync to db ??)

interface AudioStoreState {
  id: string | null;
  sound: Howl | null;
  audioUrl: string | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  rate: number;
}

type DBState = Partial<
  Pick<
    AudioStoreState,
    'isPlaying' | 'position' | 'duration' | 'volume' | 'rate'
  >
>;

interface AudioActions {
  load: (audioUrl: string, id: string, dbState?: DBState) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  setRate: (value: number) => void;
  // setPosition: (value: number) => void;
  tick: () => void;
}

type AudioStore = AudioStoreState & AudioActions;

function getStorageKey(audioUrl: string): string {
  // Create a hash of the URL to use as part of the key
  // Using a simple hash function to keep keys manageable
  let hash = 0;
  for (let i = 0; i < audioUrl.length; i++) {
    const char = audioUrl.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `audio-state-${Math.abs(hash).toString(36)}`;
}

function createHowl(
  audioUrl: string,
  position: number,
  volume: number,
  autoplay = false
): Howl {
  const sound = new Howl({
    src: [audioUrl],
    html5: true,
    autoplay,
    volume,
  });

  sound.once('load', () => {
    if (position > 0) {
      sound.seek(position);
    }
  });

  return sound;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      id: null,
      sound: null,
      audioUrl: null,
      isPlaying: false,
      position: 0,
      volume: 1,
      rate: 1,
      duration: 0,

      load: (audioUrl: string, id: string, dbState: DBState = {}) => {
        const { sound, audioUrl: currentAudioUrl, volume, isPlaying } = get();

        if (sound && currentAudioUrl === audioUrl) return;

        // Stop and unload previous sound if it exists
        if (sound) {
          if (isPlaying) {
            sound.pause();
          }
          sound.unload();
        }

        useAudioStore.persist.setOptions({
          name: getStorageKey(audioUrl),
        });
        // TODO: fetch previous if available ??

        // Use saved position if provided, otherwise use 0
        const savedPosition = dbState.position ?? 0;

        // Create new sound without autoplay - let play() handle starting
        const newSound = createHowl(audioUrl, savedPosition, volume, false);

        // Set up event listeners to keep store state in sync
        newSound.once('load', () => {
          console.log('LOAD');
          const duration = newSound.duration();
          set({ duration });
          // newSound.play();
          get().play();
        });

        newSound.on('play', () => {
          set({ isPlaying: true });
        });

        newSound.on('pause', () => {
          set({ isPlaying: false });
        });

        newSound.on('end', () => {
          const duration = newSound.duration();
          set({ isPlaying: false, position: duration });
        });

        set({
          sound: newSound,
          audioUrl,
          position: savedPosition,
          // isPlaying: false,
          duration: newSound.duration() || 0,
        });
      },

      play: () => {
        const { sound, isPlaying } = get();
        if (!sound) return;

        // If already playing, do nothing
        if (isPlaying && sound.playing()) {
          return;
        }

        // Ensure sound is playing (in case state is out of sync)
        if (!sound.playing()) {
          sound.play();
        }
        set({ isPlaying: true });
      },

      pause: () => {
        const { sound } = get();
        if (sound) {
          sound.pause();
          set({ isPlaying: false });
        }
      },

      seek: (seconds: number) => {
        const { sound } = get();
        if (sound) {
          sound.seek(seconds);
          set({ position: seconds });
        }
      },

      setVolume: (value: number) => {
        const { sound } = get();
        if (sound) {
          sound.volume(value);
          set({ volume: value });
        }
      },

      setRate: (r: number) => {
        const { sound } = get();
        if (sound) {
          sound.rate(r);
          set({ rate: r });
        }
      },

      tick: () => {
        const { sound, isPlaying } = get();
        if (!sound || !isPlaying) return;

        const pos = sound.seek() as number;
        // console.log('setting position...', pos);
        set({ position: pos });
      },
    }),

    {
      name: 'audio-state',
      // Only persist serializable parts
      partialize: (state) => ({
        audioUrl: state.audioUrl,
        position: state.position,
        isPlaying: state.isPlaying,
        volume: state.volume,
      }),

      // Rehydrate Howler instance after refresh
      onRehydrateStorage: () => (state) => {
        if (!state || !state.audioUrl) return;

        const { audioUrl, position, volume, isPlaying } = state;

        const sound = createHowl(audioUrl, position, volume, false);
        state.sound = sound;

        // Only auto-play if it was playing before refresh
        if (isPlaying) {
          sound.once('load', () => {
            sound.play();
          });
        }
      },
    }
  )
);
