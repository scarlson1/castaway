import { Grid } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useAction } from 'convex/react';
import { Card } from '~/components/Card';
import { SubscribeIconButton } from '~/components/SubscribeIconButton';

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
};
