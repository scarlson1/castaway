import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { startOfDay, sub } from 'date-fns';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TrendingCardPodIndex } from '~/components/TrendingCardPodIndex';
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
      <Stack
        direction='row'
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box>
          {cat ? (
            <Typography
              variant='overline'
              lineHeight={1.2}
              color='textSecondary'
            >
              {cat}
            </Typography>
          ) : null}
          <Typography variant='h4' gutterBottom>
            Trending
          </Typography>
        </Box>
        <FormControl sx={{ width: 180, ml: 'auto' }} size='small'>
          <InputLabel id='demo-simple-select-label'>Trending</InputLabel>
          <Select
            value={weeks}
            onChange={handleSinceChange}
            label='Trending'
            size='small'
          >
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
          <TrendingCardPodIndex
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
