import { convexQuery } from '@convex-dev/react-query';
import { Box, Grid, Typography } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';
import { TrendingCard } from '~/routes/trending.index';

export const Route = createFileRoute('/_authed/podcasts/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useSuspenseQuery(convexQuery(api.subscribe.allDetails, {}));

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        My Podcasts
      </Typography>

      <Grid
        container
        columnSpacing={{ xs: 2, sm: 1.5, md: 2 }}
        rowSpacing={{ xs: 2, sm: 3, md: 4 }}
      >
        {data.map((pod, i) => (
          <Grid key={pod._id} size={{ xs: 6, sm: 3, md: 2 }}>
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
    </Box>
  );
}
