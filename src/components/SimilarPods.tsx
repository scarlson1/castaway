import { Grid, type GridProps } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useAction } from 'convex/react';
import { Card } from '~/components/Card';
import { SubscribeIconButton } from '~/components/SubscribeIconButton';

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
          <Card
            orientation='vertical'
            imgSrc={pod.imageUrl || ''}
            title={pod.title}
            subtitle={pod.author}
            linkProps={{
              to: '/podcasts/$podId',
              params: { podId: pod.podcastId },
            }}
          >
            <SubscribeIconButton podcastId={pod.podcastId} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
