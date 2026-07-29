import { useEffect } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';
import { usePlayerSettings } from '~/hooks/usePlayerSettings';

// call once in __root.tsx

export function useRehydrateStore() {
  useEffect(() => {
    useAudioStore.persist?.rehydrate();
    usePlayerSettings.persist?.rehydrate();
  }, []);
}
