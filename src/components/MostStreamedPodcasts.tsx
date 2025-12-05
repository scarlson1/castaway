import { convexQuery, useConvexAuth } from '@convex-dev/react-query';
import { Grid } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { TrendingCardPodIndex } from '~/components/TrendingCardPodIndex';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

export const StatsMostPlayedPodcasts = ({
  pageSize = 8,
  offset = 0,
}: {
  podcastId?: string;
  pageSize?: number;
  offset?: number;
}) => {
  const { isAuthenticated } = useConvexAuth();
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
          <TrendingCardPodIndex
            feed={
              // TODO: fix TrendingCard type
              {
                id: pod.podcastId as unknown as number,
                podcastGuid: pod.podcastId,
                artwork: pod.imageUrl || '',
                title: pod.title,
                author: pod.author,
                itunesId: pod.itunesId,
              } as PodcastFeed
            }
            orientation='vertical'
            // TODO: switch to using guid ?? or add podIndexId
            linkProps={
              // isAuthenticated ?
              {
                to: '/podcasts/$podId',
                params: { podId: pod.podcastId },
              }
              // : {
              //     to: '/podcast/$podId',
              //     params: { podId: pod. },
              //   }
            }
          />
        </Grid>
      ))}
    </Grid>
  );
};
