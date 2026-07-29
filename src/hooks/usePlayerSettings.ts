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
    // skipHydration keeps the first client render identical to the SSR output —
    // useRehydrateStore() applies the persisted value in an effect instead
    { name: 'player-settings', skipHydration: true }
  )
);
