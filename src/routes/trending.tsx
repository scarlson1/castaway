import {
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { startOfDay, sub } from 'date-fns';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  StatsMostPlayedEpisodes,
  StatsMostPlayedPodcasts,
} from '~/components/StatsMostPlayedEpisodes';
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
  const navigate = Route.useNavigate();
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

  const clearCategory = useCallback(() => {
    navigate({
      to: '/trending',
    });
  }, []);

  return (
    <>
      <Stack
        direction='row'
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant='h4' gutterBottom>
            Trending
          </Typography>
          {cat ? (
            <Chip
              label={cat}
              variant='outlined'
              // onClick={handleClick}
              onDelete={clearCategory}
            />
          ) : null}
        </Stack>
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

      {cat ? (
        <ErrorBoundary
          fallback={<div>failed to load category most popular</div>}
        >
          <Suspense>
            <CategoryMostPopular category={cat} lang='en' since={since} />
          </Suspense>
        </ErrorBoundary>
      ) : null}

      {!cat ? (
        <Stack direction='column' spacing={3} sx={{ py: 3 }}>
          <Divider flexItem />
          <Typography variant='h6' fontWeight={500}>
            Most streamed episodes
          </Typography>
          <ErrorBoundary
            fallback={<div>Error loading most played episodes</div>}
          >
            <Suspense>
              <StatsMostPlayedEpisodes
                pageSize={2}
                podcastId={'6007cced-b61d-5005-b01b-6c4e7b5f1987'}
              />
            </Suspense>
          </ErrorBoundary>
          <Divider flexItem />
        </Stack>
      ) : null}

      {!cat ? (
        <Stack direction='column' spacing={3} sx={{ py: 3 }}>
          <Divider flexItem />
          <Typography variant='h6' fontWeight={500}>
            Most streamed podcasts
          </Typography>
          <ErrorBoundary fallback={<div>Error loading most played pods</div>}>
            <Suspense>
              <StatsMostPlayedPodcasts pageSize={2} />
            </Suspense>
          </ErrorBoundary>
          <Divider flexItem />
        </Stack>
      ) : null}

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

function CategoryMostPopular({
  category,
  lang = 'en',
  since,
}: {
  category: string | number;
  lang?: string;
  since?: number;
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { data } = useSuspenseQuery(
    trendingQueryOptions({ max: 8, lang, cat: category, since })
  );

  const items = useMemo(
    () => data?.feeds?.slice(0, isSmallScreen ? 4 : 8),
    [data, isSmallScreen]
  );

  return (
    <Stack spacing={3} sx={{ py: { xs: 3, md: 5 } }}>
      <Divider flexItem />

      <Typography
        variant='h5'
        gutterBottom
        fontWeight='medium'
      >{`Most popular in ${category}`}</Typography>

      <Grid container columnSpacing={1.5} rowSpacing={2} columns={16}>
        {items.map((f) => (
          <Grid key={`${f.id}-cat`} size={{ xs: 8, sm: 4, md: 2 }}>
            <TrendingCardPodIndex feed={f} orientation='vertical' />
          </Grid>
        ))}
      </Grid>

      <Divider flexItem />
    </Stack>
  );
}
