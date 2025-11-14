import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query';
import { AddRounded, RemoveRounded } from '@mui/icons-material';
import {
  alpha,
  Box,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  styled,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute, type LinkProps } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { api } from 'convex/_generated/api';
import { startOfDay, sub } from 'date-fns';
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import { MuiStackLink } from '~/components/MuiStackLink';
import { useHover } from '~/hooks/useHover';
import type { PodcastFeed, TrendingFeed } from '~/lib/podcastIndexTypes';
import {
  fetchTrending,
  fetchTrendingOptions,
  type FetchTrendingOptions,
} from '~/serverFn/trending';

export const trendingQueryOptions = (options: FetchTrendingOptions) =>
  queryOptions({
    queryKey: ['trending', options],
    queryFn: () => fetchTrending({ data: options }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const Route = createFileRoute('/trending/')({
  component: RouteComponent,
  validateSearch: zodValidator(fetchTrendingOptions),
  loader: ({ context: { queryClient }, params }) => {
    // fetch but don't block/await
    queryClient.prefetchQuery(trendingQueryOptions(params));
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

  const { data } = useSuspenseQuery(
    trendingQueryOptions({ max, lang, cat, notcat, since })
  );

  const { data: subscribed } = useSuspenseQuery(
    convexQuery(api.subscribe.all, {})
  );

  const subscribedPodIds = useMemo(
    () => subscribed.map((s) => s.podcastId),
    [subscribed]
  );

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
    </>
  );
}

interface TrendingCardProps {
  feed: PodcastFeed | TrendingFeed;
  orientation?: 'vertical' | 'horizontal';
  rank?: number;
  linkProps?: LinkProps;
  following?: boolean;
  numbered?: boolean;
}

// use clsx for orientation styling ??
// TODO: finish support for orientation

export function TrendingCard({
  feed,
  orientation = 'horizontal',
  rank,
  linkProps,
  following,
  numbered = true,
}: TrendingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: useConvexAction(api.actions.subscribe),
  });

  const { mutate: unsubscribe, isPending: unsubPending } = useMutation({
    mutationFn: useConvexMutation(api.subscribe.remove),
  });
  // TODO: optimistic update instead of isPending
  // TODO:  unfollow if subscribed

  let isRow = orientation === 'horizontal';

  // console.log('POD ID: ', feed.podcastGuid);

  function renderActions() {
    if (!(feed as PodcastFeed).podcastGuid) return null;
    return (
      <>
        {!following ? (
          <IconButton
            size='small'
            loading={isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              subscribe({ podcastId: (feed as PodcastFeed).podcastGuid });
            }}
            disableRipple
            sx={{
              color: '#fff',
              bgcolor: alpha('#363D49', 0.5),
              '&:hover': {
                color: 'grey.500',
                bgcolor: '#fff',
              },
            }}
          >
            <AddRounded fontSize='inherit' />
          </IconButton>
        ) : (
          <IconButton
            size='small'
            loading={unsubPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              unsubscribe({ podId: (feed as PodcastFeed).podcastGuid });
            }}
            disableRipple
            sx={{
              color: '#fff',
              bgcolor: alpha('#363D49', 0.5),
              '&:hover': {
                color: 'error.main',
                bgcolor: '#fff',
              },
            }}
          >
            <RemoveRounded fontSize='inherit' />
          </IconButton>
        )}
      </>
    );
  }

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
          {!isRow ? (
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
              {renderActions()}
            </Box>
          ) : null}
        </Box>

        <ClampedTypography variant='body1' color='textPrimary'>
          {feed.title}
        </ClampedTypography>
        <ClampedTypography variant='body2' color='textSecondary'>
          {feed.author}
        </ClampedTypography>
        {isRow ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              opacity: isHovering ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            {renderActions()}
            {/* <IconButton
              size='small'
              loading={isPending}
              onClick={() => subscribe({ podId: feed.podcastGuid })}
            >
              <AddRounded fontSize='inherit' />
            </IconButton> */}
          </Box>
        ) : null}
      </MuiStackLink>
    </div>
  );
}
