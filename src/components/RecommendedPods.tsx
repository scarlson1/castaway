import { Grid } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useAction } from 'convex/react';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';
import { TrendingCard } from '~/routes/trending';

export const RecommendedPods = ({ limit = 8 }: { limit?: number }) => {
  const getPersonalizedRecommendations = useAction(
    api.podcasts.getPersonalizedRecommendations
  );
  const { data } = useSuspenseQuery({
    queryKey: ['recs', 'podcasts', { limit }],
    queryFn: () => getPersonalizedRecommendations({ limit: 8 }),
  });

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data.map((pod) => (
        <Grid size={{ xs: 8, sm: 4, md: 4, lg: 2 }} key={pod._id}>
          <TrendingCard
            feed={
              // TODO: fix TrendingCard type
              {
                id: pod.podcastId as unknown as number,
                artwork: pod.imageUrl || '',
                title: pod.title,
                author: pod.author,
              } as PodcastFeed
            }
            orientation='vertical'
            // TODO: switch to using guid ?? or add podIndexId
            linkProps={{
              to: '/podcasts/$podId',
              params: { podId: pod.podcastId },
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
};
