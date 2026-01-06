import { useEffect } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';

// call once in __root.tsx

export function useRehydrateStore() {
  const store = useAudioStore;

  useEffect(() => {
    store.persist?.rehydrate();
  }, []);
}
