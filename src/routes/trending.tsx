import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  styled,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, type LinkProps } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { startOfDay, sub } from 'date-fns';
import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MuiStackLink } from '~/components/MuiStackLink';
import { SubscribeIconButton } from '~/components/SubscribeIconButton';
import { useHover } from '~/hooks/useHover';
import type { PodcastFeed, TrendingFeed } from '~/lib/podcastIndexTypes';
import { trendingQueryOptions } from '~/queries';
import {
  fetchTrendingOptions,
  type FetchTrendingOptions,
} from '~/serverFn/trending';

export const Route = createFileRoute('/trending')({
  component: RouteComponent,
  validateSearch: zodValidator(fetchTrendingOptions),
  loaderDeps: ({ search: { max, lang, cat, notcat } }) => ({
    max,
    lang,
    cat,
    notcat,
  }),
  loader: ({ context: { queryClient }, params, deps }) => {
    // fetch but don't block/await
    queryClient.prefetchQuery(
      trendingQueryOptions({
        // ...params,
        max: deps.max || 100,
        lang: deps.lang || 'en',
        since: weekToSeconds(4),
        cat: deps.cat,
        notcat: deps.notcat,
      })
    );
  },
});

const ClampedTypography = styled(Typography)({
  overflow: 'hidden',
  display: '-webkit-box',
  // lineClamp: 2,
  '-webkit-line-clamp': '2',
  '-webkit-box-orient': 'vertical',
  // boxOrient: 'vertical',
  textOverflow: 'ellipsis',
});

function weekToSeconds(weeks: number) {
  return Math.floor(sub(startOfDay(new Date()), { weeks }).getTime() / 1000);
}

function RouteComponent() {
  const {
    max = 100,
    lang = 'en',
    cat,
    notcat,
    // since = sinceSeconds,
  } = Route.useSearch();
  const [weeks, setWeeks] = useState('4');

  const since = useMemo(() => weekToSeconds(parseInt(weeks)), [weeks]);

  const handleSinceChange = useCallback((event: SelectChangeEvent) => {
    setWeeks(event.target.value);
  }, []);

  return (
    <>
      <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
        <Typography variant='h4' gutterBottom>
          Trending
        </Typography>
        <FormControl sx={{ width: 180, ml: 'auto' }}>
          <InputLabel id='demo-simple-select-label'>Trending</InputLabel>
          <Select value={weeks} onChange={handleSinceChange} label='Trending'>
            <MenuItem value={1}>last week</MenuItem>
            <MenuItem value={4}>last month</MenuItem>
            <MenuItem value={52}>last year</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <ErrorBoundary fallback={<div>something went wrong</div>}>
        <Suspense>
          <TrendingCardsGrid
            max={max}
            lang={lang}
            cat={cat}
            notcat={notcat}
            since={since}
          />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function TrendingCardsGrid({
  max,
  lang,
  cat,
  notcat,
  since,
}: FetchTrendingOptions) {
  const { data } = useSuspenseQuery(
    trendingQueryOptions({ max, lang, cat, notcat, since })
  );

  // TODO: requires podIndexId or itunesId ??
  // const { data: subscribed } = useSuspenseQuery(
  //   convexQuery(api.subscribe.all, {})
  // );

  // const subscribedPodIds = useMemo(
  //   () => subscribed.map((s) => s.podcastId),
  //   [subscribed]
  // );

  return (
    <Grid
      container
      columnSpacing={{ xs: 2, sm: 1.5, md: 2 }}
      rowSpacing={{ xs: 2, sm: 3, md: 4 }}
    >
      {data.feeds.map((f, i) => (
        <Grid key={f.id} size={{ xs: 6, sm: 3, md: 2 }}>
          <TrendingCard
            feed={f}
            orientation='vertical'
            rank={i + 1}
            // following={subscribedPodIds.includes(f.podcastGuid)}
          />
        </Grid>
      ))}
    </Grid>
  );
}

interface TrendingCardProps {
  feed: PodcastFeed | TrendingFeed;
  orientation?: 'vertical' | 'horizontal';
  rank?: number;
  linkProps?: LinkProps;
}

// use clsx for orientation styling ??
// TODO: finish support for orientation

export function TrendingCard({
  feed,
  orientation = 'horizontal',
  rank,
  linkProps,
}: TrendingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  let isRow = orientation === 'horizontal';

  return (
    <div ref={ref}>
      <MuiStackLink
        direction={isRow ? 'row' : 'column'}
        spacing={isRow ? 2 : 0.5}
        to={'/podcast/$podId'}
        params={{ podId: `${feed.id || ''}` }}
        sx={{
          textDecoration: 'none',
          '&:visited': { color: 'textPrimary' },
          '&:hover': { color: 'textPrimary' },
        }}
        {...linkProps}
      >
        {rank !== undefined ? (
          <Typography
            variant='overline'
            color='textSecondary'
            sx={{ lineHeight: '1.4', textAlign: 'center' }}
          >
            {rank || ''}
          </Typography>
        ) : null}

        <Box sx={{ position: 'relative' }}>
          <Box
            component='img'
            src={feed.artwork || feed.image}
            alt={`${feed.title} cover img`}
            sx={{ width: '100%', borderRadius: 1 }}
          />
          {!isRow && (feed as PodcastFeed).podcastGuid ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                position: 'absolute',
                bottom: 8,
                right: 4,
              }}
            >
              <SubscribeIconButton
                podcastId={(feed as PodcastFeed).podcastGuid}
              />
            </Box>
          ) : null}
        </Box>

        <ClampedTypography variant='body1' color='textPrimary'>
          {feed.title}
        </ClampedTypography>
        <ClampedTypography variant='body2' color='textSecondary'>
          {feed.author}
        </ClampedTypography>
        {isRow && (feed as PodcastFeed).podcastGuid ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              opacity: isHovering ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            <SubscribeIconButton
              podcastId={(feed as PodcastFeed).podcastGuid}
            />
          </Box>
        ) : null}
      </MuiStackLink>
    </div>
  );
}

// import { createFileRoute, Outlet } from '@tanstack/react-router';
// import { Suspense } from 'react';
// import { ErrorBoundary } from 'react-error-boundary';

// export const Route = createFileRoute('/trending')({
//   component: RouteComponent,
//   // validateSearch: zodValidator(trendingSearchOptions),
// });

// function RouteComponent() {
//   // TODO: reuse card on discover page ?? pass prop for orientation --> flexDirection: 'column-reverse' or 'row' ??

//   return (
//     <>
//       {/* <Typography variant='h4' gutterBottom>
//           Trending
//         </Typography> */}

//       {/* <MuiButtonLink to='/trending'>Podcast Index</MuiButtonLink> */}
//       {/* <MuiButtonLink to='/trending/apple'>Apple Charts</MuiButtonLink> */}
//       <ErrorBoundary fallback={<div>An error occurred</div>}>
//         <Suspense>
//           <Outlet />
//         </Suspense>
//       </ErrorBoundary>
//     </>
//   );
// }
