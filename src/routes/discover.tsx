import { AddRounded, ArrowForwardIos } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useCallback, useRef, type RefObject } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { MuiStackLink } from '~/components/MuiStackLink';
import { useHover } from '~/hooks/useHover';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';
import {
  fetchAppleCharts,
  fetchTrending,
  type FetchAppleChartsOptions,
} from '~/serverFn/trending';

// TODO: add category selection at top of page

export const Route = createFileRoute('/discover')({
  component: RouteComponent,
  loader: () => fetchTrending({ data: { max: 8 } }),
});

function RouteComponent() {
  const { feeds } = Route.useLoaderData();

  return (
    <>
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
            <TrendingCard feed={p} />
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 3 }} />
      <Alert severity='warning' sx={{ maxWidth: 600, my: 2 }}>
        <AlertTitle>TODO: suggested pods</AlertTitle>
        vectorized db & ML suggested posts
      </Alert>
      <Box>
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
            <Suspense>
              <AppleCharts />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </>
  );
}

export const appleChartsQueryOptions = (
  options: FetchAppleChartsOptions = {}
) =>
  queryOptions({
    queryKey: ['trending', 'apple', options],
    queryFn: () => fetchAppleCharts({ data: options }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

function AppleCharts() {
  const { data } = useSuspenseQuery(appleChartsQueryOptions({ limit: 10 }));
  console.log('APPLE CHART DATA: ', data);

  return (
    <Box>
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
        {data.feed.results.map((p) => (
          <Grid
            size={{ xs: 12, sm: 6 }}
            sx={{ width: 'unset !important', mb: 1 }}
            key={p.id}
          >
            <TrendingCard
              feed={
                {
                  id: '',
                  artwork: p.artworkUrl100,
                  title: p.name,
                  author: p.artistName,
                } as unknown as PodcastFeed
              }
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

interface TrendingCardProps {
  feed: PodcastFeed;
  orientation?: 'vertical' | 'horizontal';
}

// use clsx for orientation styling ??

function TrendingCard({ feed }: TrendingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  const handleSubscribePod = useCallback((e) => {
    e.preventDefault();
    // TODO: useMutation ==> add to user's subscription & invalidate cache
    alert('not implemented yet');
  }, []);

  // TODO: subscribe icon button show subscription status & unfollow if subscribed

  return (
    <div ref={ref}>
      <MuiStackLink
        direction='row'
        spacing={2}
        to={'/podcast/$podId'}
        params={{ podId: `${feed.id || ''}` }}
        sx={{
          textDecoration: 'none',
          '&:visited': { color: 'textPrimary' },
          '&:hover': { color: 'textPrimary' },
        }}
      >
        <Box
          component='img'
          src={feed.artwork || feed.image}
          sx={{
            height: 60,
            width: 60,
            borderRadius: 1,
            overflow: 'hidden',
            flex: '0 0 60px',
          }}
        />
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant='subtitle1'
            color='textPrimary'
            fontWeight='medium'
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {feed.title}
          </Typography>
          <Typography
            variant='subtitle2'
            component='p'
            color='textSecondary'
            fontWeight={500}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {feed.author}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <IconButton size='small' onClick={handleSubscribePod}>
            <AddRounded fontSize='inherit' />
          </IconButton>
        </Box>
      </MuiStackLink>
    </div>
  );
}
