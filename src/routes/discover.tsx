import { convexQuery, useConvexAuth } from '@convex-dev/react-query';
import { ArrowForwardIos } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense, useId } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { SimilarPodcasts } from '~/components/SimilarPods';
import { TrendingCardPodIndex } from '~/components/TrendingCardPodIndex';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';
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
  const { isAuthenticated } = useConvexAuth();

  return (
    <Stack direction='column' spacing={2}>
      <Typography variant='h4' component='h2' gutterBottom>
        Discover
      </Typography>
      <Alert severity='warning' sx={{ maxWidth: 600, my: 2 }}>
        <AlertTitle>TODO: Featured</AlertTitle>
        featured section (carousel cards)
      </Alert>

      <Divider />

      <Stack
        direction='row'
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'center', my: 3 }}
      >
        <Typography variant='h4' fontWeight='medium' gutterBottom>
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

      {isAuthenticated ? <SimilarToLastListened /> : null}

      {/* <Box>
        <Divider />
        <Stack
          direction='row'
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center', my: 3 }}
        >
          <Typography variant='h4' fontWeight='medium' gutterBottom>
            Apple Top Charts
          </Typography>
          <MuiButtonLink
            to='/trending/apple'
            size='small'
            endIcon={<ArrowForwardIos fontSize='small' />}
          >
            See more
          </MuiButtonLink>
        </Stack>
        <Box>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <Suspense fallback={<TrendingSectionSkeleton />}>
              <AppleCharts />
            </Suspense>
          </ErrorBoundary>
        </Box> 
      </Box>*/}
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
      {feeds.map((p) => (
        <Grid
          size={{ xs: 12, sm: 6 }}
          sx={{ width: 'unset !important', mb: 1 }}
          key={p.id}
        >
          <TrendingCardPodIndex
            feed={
              {
                id: p.id,
                artwork: p.artwork,
                title: p.title,
                author: p.author,
                itunesId: p.itunesId,
              } as PodcastFeed
            }
          />
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
