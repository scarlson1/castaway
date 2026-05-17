import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerSettings {
  autoSkipAds: boolean;
  toggleAutoSkipAds: () => void;
}

export const usePlayerSettings = create<PlayerSettings>()(
  persist(
    (set) => ({
      autoSkipAds: false,
      toggleAutoSkipAds: () => set((s) => ({ autoSkipAds: !s.autoSkipAds })),
    }),
    { name: 'player-settings' }
  )
);
