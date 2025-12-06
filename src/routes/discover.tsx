import { convexQuery } from '@convex-dev/react-query';
import { ArrowForwardIos } from '@mui/icons-material';
import { Box, Divider, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense, useId } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Authed } from '~/components/Authed';
import { Card } from '~/components/Card';
import { Featured } from '~/components/Featured';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { RecommendedEpisodes } from '~/components/RecommendedEpisodes';
import { SimilarPodcasts } from '~/components/SimilarPods';
import { SubscribeIconButtonITunes } from '~/components/SubscribeIconButtonITunes';
import { trendingQueryOptions } from '~/queries';

// TODO: add category selection at top of page

export const Route = createFileRoute('/discover')({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    // seed cache, but don't block
    queryClient.prefetchQuery(trendingQueryOptions({ max: 8 }));
    // queryClient.prefetchQuery(appleChartsQueryOptions({ limit: 10 }));
  },
});

function RouteComponent() {
  return (
    <Stack direction='column' spacing={3}>
      <Typography variant='h4' component='h2' gutterBottom>
        Discover
      </Typography>
      <Featured />

      <Divider />

      <Stack
        direction='row'
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'center', my: 3 }}
      >
        <Typography variant='h6' gutterBottom>
          Trending
        </Typography>
        <MuiButtonLink
          to='/trending'
          size='small'
          endIcon={<ArrowForwardIos fontSize='small' />}
        >
          See all
        </MuiButtonLink>
      </Stack>
      {/* <Grid container spacing={3} sx={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)'}}> */}
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Suspense fallback={<TrendingSectionSkeleton />}>
          <Trending />
        </Suspense>
      </ErrorBoundary>

      <Divider />

      <Authed>
        <SimilarToLastListened />
      </Authed>

      <Divider />

      <Authed>
        <Box>
          <Typography variant='overline' lineHeight={1.2} color='textSecondary'>
            Based on your listening
          </Typography>
          <Typography variant='h6' gutterBottom>
            Episodes you might like
          </Typography>
        </Box>

        <ErrorBoundary fallback={<div>Error loading recommendations</div>}>
          <RecommendedEpisodes limit={8} />
        </ErrorBoundary>
      </Authed>
    </Stack>
  );
}

function Trending() {
  const {
    data: { feeds },
  } = useSuspenseQuery(trendingQueryOptions({ max: 8 }));

  return (
    <Grid
      container
      rowSpacing={1}
      columnSpacing={3}
      // sx={{
      //   display: 'grid',
      //   gridTemplateRows: 'repeat(4, 1fr)',
      //   gridTemplateColumns: {
      //     xs: 'repeat(1, minmax(0px, 1fr))',
      //     sm: 'repeat(2, minmax(0px, 1fr))',
      //   },
      //   gridAutoRows: 0,
      //   overflow: 'hidden',
      //   rowGap: 0, // add margin bottom to child grid container
      // }}
    >
      {feeds.map((pod) => (
        <Grid
          size={{ xs: 12, sm: 6 }}
          // sx={{ width: 'unset !important', mb: 1 }}
          key={pod.id}
        >
          <Card
            orientation='horizontal'
            imgSrc={pod.artwork || ''}
            title={pod.title}
            subtitle={pod.author}
            linkProps={{
              to: '/podcast/$podId',
              params: { podId: `${pod.id}` },
            }}
          >
            <SubscribeIconButtonITunes itunesId={pod.itunesId} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function SkeletonTrendingCard() {
  return (
    <>
      <Skeleton variant='rounded' width={'100%'} height={60} />
    </>
  );
}

function TrendingSectionSkeleton() {
  const id = useId();

  return (
    <Grid
      container
      rowSpacing={1}
      columnSpacing={3}
      sx={{
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        gridTemplateColumns: {
          xs: 'repeat(1, minmax(0px, 1fr))',
          sm: 'repeat(2, minmax(0px, 1fr))',
        },
        gridAutoRows: 0,
        overflow: 'hidden',
        rowGap: 0, // add margin bottom to child grid container
      }}
    >
      {Array(8).map((_, i) => (
        <Grid
          size={{ xs: 12, sm: 6 }}
          sx={{ width: 'unset !important', mb: 1 }}
          key={`${id}-${i}`}
        >
          <SkeletonTrendingCard />
        </Grid>
      ))}
    </Grid>
  );
}

function SimilarToLastListened() {
  const { data } = useQuery(convexQuery(api.playback.lastListened, {}));

  if (!data?.podcastId) return null;

  return (
    <>
      <Box>
        {data.podcastTitle ? (
          <Typography
            variant='overline'
            lineHeight={1.2}
            color='textSecondary'
          >{`because you listened to ${data.podcastTitle}`}</Typography>
        ) : null}
        <Typography variant='h6' gutterBottom>
          You might like
        </Typography>
      </Box>

      <SimilarPodcasts podId={data.podcastId} />
    </>
  );
}
