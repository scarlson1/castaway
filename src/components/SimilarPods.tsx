import { Grid, type GridProps } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useAction } from 'convex/react';
import { TrendingCardPodIndex } from '~/components/TrendingCardPodIndex';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

export function SimilarPodcasts({
  podId,
  limit = 4,
  gridItemProps,
}: {
  podId: string;
  limit?: number;
  gridItemProps?: GridProps;
}) {
  const getSimilarPods = useAction(api.podcasts.getSimilarPodcasts);

  const { data } = useSuspenseQuery({
    queryKey: ['recs', 'podcasts', { limit, podId }],
    queryFn: () => getSimilarPods({ limit, podId }),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data.map((pod) => (
        <Grid
          size={{ xs: 8, sm: 4, md: 4, lg: 2 }}
          key={pod._id}
          {...gridItemProps}
        >
          <TrendingCardPodIndex
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
}
