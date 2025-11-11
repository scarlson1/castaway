import { createServerOnlyFn } from '@tanstack/react-start';
import PodIndexClient from '~/lib/podcastIndexApi';

// ✅ Server-only access
export const getPodClient = createServerOnlyFn(() => {
  return PodIndexClient(
    process.env.PODCAST_INDEX_KEY,
    process.env.PODCAST_INDEX_SECRET
  );
});
