import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AudioState {
  podcastId: string | null;
  episodeId: string | null;
  audioUrl: string | null;
  isPlaying: boolean;
  position: number; // seconds
  volume: number;
  rate: number;
  duration: number;

  // actions
  loadAudio: (
    podcastId: string,
    episodeId: string,
    audioUrl: string,
    incomingState?: Partial<AudioState>
  ) => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (seconds: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number) => void;

  reset: () => void;
}

// Generates a unique store key per episode
const storageKey = (episodeId: string) => `audio-player-${episodeId}`;

// TODO: rate and sync playback to db

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      podcastId: null,
      episodeId: null,
      audioUrl: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: 1,
      rate: 1,

      loadAudio: (
        podcastId: string,
        episodeId: string,
        audioUrl,
        serverState = {}
      ) => {
        useAudioStore.persist.setOptions({
          name: storageKey(episodeId),
        });
        let localState = JSON.parse(
          localStorage.getItem(storageKey(episodeId)) || '{}'
        );
        console.log('LOCAL STORAGE STATE: ', localState);

        // merge server-side & local state (server wins)
        const merged = {
          ...(localState?.state || {}),
          ...serverState,
        };

        set({
          podcastId,
          episodeId,
          audioUrl,
          isPlaying: false, // TODO: how should isPlaying state be handled ??
          position: merged.position ?? 0,
          volume: merged.volume ?? 1,
        });
      },

      setPlaying: (isPlaying) => set({ isPlaying }),
      setPosition: (position) => set({ position }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume }),
      setRate: (rate) => set({ rate }),

      reset: () =>
        set({
          podcastId: null,
          episodeId: null,
          audioUrl: null,
          isPlaying: false,
          position: 0,
          volume: 1,
        }),
    }),
    {
      name: 'audio-player-global', // ignored but required by API
      storage: {
        getItem: (key) => {
          const state = useAudioStore.getState();
          if (!state.episodeId) return null;
          let val = localStorage.getItem(storageKey(state.episodeId));
          let parse = val ? JSON.parse(val) : {};
          return parse?.state || {};
        },
        setItem: (_key, value) => {
          const state = useAudioStore.getState();
          if (!state.episodeId || !value) return;
          // console.log('SET ITEM: ', value);
          localStorage.setItem(
            storageKey(state.episodeId),
            JSON.stringify(value)
          );
        },
        removeItem: (_key) => {
          const state = useAudioStore.getState();
          if (!state.episodeId) return;
          localStorage.removeItem(storageKey(state.episodeId));
        },
      } as any,
      partialize: (state) => ({
        position: state.position,
        volume: state.volume,
        podcastId: state.podcastId,
        episodeId: state.episodeId,
        isPlaying: state.isPlaying,
      }),
    }
  )
);
