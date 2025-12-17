import {
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
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
import { Card } from '~/components/Card';
import { StatsMostPlayedPodcasts } from '~/components/MostStreamedPodcasts';
import { StatsMostPlayedEpisodes } from '~/components/StatsMostPlayedEpisodes';
import { SubscribeIconButtonITunes } from '~/components/SubscribeIconButtonITunes';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
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
            <Chip label={cat} variant='outlined' onDelete={clearCategory} />
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

      <Stack
        direction='column'
        spacing={3}
        sx={{ py: 3 }}
        divider={<Divider flexItem />}
      >
        {cat ? (
          <>
            <Typography variant='h6' gutterBottom fontWeight={500}>
              {`Popular in ${cat}`}
            </Typography>
            <ErrorBoundary
              fallback={<div>failed to load category most popular</div>}
            >
              <Suspense fallback={<SkeletonCardSection numItems={8} />}>
                <CategoryMostPopular category={cat} lang='en' since={since} />
              </Suspense>
            </ErrorBoundary>
          </>
        ) : null}

        {!cat ? (
          <>
            <Typography variant='h6' gutterBottom fontWeight={500}>
              Most streamed episodes
            </Typography>
            <ErrorBoundary
              fallback={<div>Error loading most played episodes</div>}
            >
              <Suspense
                fallback={
                  <SuspenseGridCards
                    numItems={8}
                    columnSpacing={2}
                    rowSpacing={1}
                    columns={16}
                    childGridProps={{ size: { xs: 8, sm: 4, md: 4, lg: 2 } }}
                  />
                }
              >
                <StatsMostPlayedEpisodes pageSize={8} />
              </Suspense>
            </ErrorBoundary>
          </>
        ) : null}

        {!cat ? (
          <>
            <Typography variant='h6' gutterBottom fontWeight={500}>
              Most streamed podcasts
            </Typography>
            <ErrorBoundary fallback={<div>Error loading most played pods</div>}>
              <Suspense
                fallback={
                  <SuspenseGridCards
                    numItems={8}
                    spacing={2}
                    columns={12}
                    childGridProps={{
                      size: { xs: 6, sm: 3, md: 2 },
                    }}
                    orientation='vertical'
                  />
                }
              >
                <StatsMostPlayedPodcasts pageSize={8} />
              </Suspense>
            </ErrorBoundary>
          </>
        ) : null}

        <>
          <Typography variant='h6' fontWeight={500}>
            Podcast Index Trending
          </Typography>
          <ErrorBoundary fallback={<div>something went wrong</div>}>
            <Suspense
              fallback={
                <SuspenseGridCards
                  numItems={8}
                  columnSpacing={{ xs: 2, sm: 1.5, md: 2 }}
                  rowSpacing={{ xs: 2, sm: 3, md: 4 }}
                  columns={12}
                  childGridProps={{
                    size: { xs: 6, sm: 3, md: 2 },
                  }}
                  orientation='vertical'
                />
              }
            >
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
      </Stack>
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

  return (
    <Grid
      container
      columnSpacing={{ xs: 2, sm: 1.5, md: 2 }}
      rowSpacing={{ xs: 2, sm: 3, md: 4 }}
    >
      {data.feeds.map((pod, i) => (
        <Grid key={pod.id} size={{ xs: 6, sm: 3, md: 2 }}>
          <Card
            orientation='vertical'
            imgSrc={pod.image}
            title={pod.title}
            subtitle={pod.author}
            rank={i + 1}
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
    // <Stack spacing={3} sx={{ py: { xs: 3, md: 5 } }}>
    //   <Divider flexItem />

    //   <Typography
    //     variant='h5'
    //     gutterBottom
    //     fontWeight='medium'
    //   >{`Most popular in ${category}`}</Typography>

    <Grid container columnSpacing={1.5} rowSpacing={2} columns={16}>
      {items.map((pod) => (
        <Grid key={`${pod.id}-cat`} size={{ xs: 8, sm: 4, md: 2 }}>
          <Card
            orientation='vertical'
            imgSrc={pod.image || pod.artwork}
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

    //   <Divider flexItem />
    // </Stack>
  );
}

function SkeletonCardSection({ numItems }: { numItems: number }) {
  return (
    <Stack spacing={3} sx={{ py: { xs: 3, md: 5 } }}>
      <Divider flexItem />

      <Typography variant='h5' gutterBottom fontWeight='medium'>
        <Skeleton />
      </Typography>

      <SuspenseGridCards
        numItems={numItems}
        columnSpacing={1.5}
        rowSpacing={2}
        columns={16}
        childGridProps={{
          size: { xs: 8, sm: 4, md: 2 },
        }}
        orientation='vertical'
      />

      <Divider flexItem />
    </Stack>
  );
}
