import { convexQuery } from '@convex-dev/react-query';
import { Grid } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Card } from '~/components/Card';
import { SubscribeIconButton } from '~/components/SubscribeIconButton';

export const StatsMostPlayedPodcasts = ({
  pageSize = 8,
  offset = 0,
}: {
  podcastId?: string;
  pageSize?: number;
  offset?: number;
}) => {
  // const { isAuthenticated } = useConvexAuth();
  const { data } = useSuspenseQuery(
    convexQuery(api.stats.podcasts.mostPlayed, {
      numItems: pageSize,
      offset,
    })
  );

  return (
    <Grid container spacing={2}>
      {data.page.map((pod) => (
        <Grid key={pod._id} size={{ xs: 6, sm: 3, md: 2 }}>
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
