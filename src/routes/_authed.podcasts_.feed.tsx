import {
  Box,
  Button,
  Container,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { MuiStackLink } from '~/components/MuiStackLink';
import { formatRelativeTime } from '~/utils/format';

export const Route = createFileRoute('/_authed/podcasts_/feed')({
  component: RouteComponent,
});

function RouteComponent() {
  // const { data } = useSuspenseQuery(
  //   convexQuery(api.episodes.feed, { numItems: 50 })
  // );

  return (
    <Container maxWidth='sm' disableGutters>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='h6' gutterBottom>
          Recently Updated
        </Typography>
        {/* <SignedIn>
          <MuiButtonLink to='/podcasts/feed'>See all</MuiButtonLink>
        </SignedIn> */}
      </Box>
      <RecentlyUpdated />
    </Container>
  );
}

const PAGE_SIZE = 30;

function RecentlyUpdated() {
  const { convexClient } = Route.useRouteContext();
  const [ref, inView] = useInView();

  const fetchEpisodes = async ({ pageParam }) => {
    console.log('FETCHING NEXT PAGE: ', pageParam);
    const data = await convexClient.query(api.episodes.getRecentFeed, {
      pageSize: PAGE_SIZE, // pageParam,
      cursor: pageParam,
      // pageSize,
      // cursor
    });
    console.log('DATA fetchEpisodes: ', data);
    return data;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['episodesFeed'],
    queryFn: fetchEpisodes,
    staleTime: 1000 * 60 * 5,
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      // console.log('LAST PAGE: ', lastPage);
      return lastPage.cursor;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!data || !data.pages) return null;

  return (
    <Stack direction='column' spacing={1}>
      {data?.pages?.map((page) =>
        page.items?.map((ep) => (
          <TrendingCard
            key={ep._id}
            title={ep.title}
            secondaryText={ep.podcastTitle}
            actionText={formatRelativeTime(new Date(ep.publishedAt))}
            podId={ep.podcastId}
            episodeId={ep.episodeId}
            imgSrc={ep.feedImage || ep.image || ''}
          />
        ))
      )}
      <Button
        ref={ref}
        onClick={() => fetchNextPage()}
        loading={isFetchingNextPage}
        disabled={!hasNextPage}
      >
        Load more
      </Button>
    </Stack>
  );
}

const ClampedTypography = styled(Typography)({
  overflow: 'hidden',
  display: '-webkit-box',
  // lineClamp: 2,
  '-webkit-line-clamp': '2',
  '-webkit-box-orient': 'vertical',
  // boxOrient: 'vertical',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

interface TrendingCardProps {
  title: string;
  secondaryText: string;
  actionText?: string;
  orientation?: 'vertical' | 'horizontal';
  rank?: number;
  podId: string;
  episodeId: string;
  imgSrc: string;
  // linkProps?: LinkProps;
}

// TODO: reusable component
export function TrendingCard({
  title,
  secondaryText,
  actionText,
  podId,
  episodeId,
  imgSrc,
  orientation = 'horizontal',
  rank,
}: // linkProps,
TrendingCardProps) {
  let isRow = orientation === 'horizontal';

  return (
    <div>
      <MuiStackLink
        direction={isRow ? 'row' : 'column'}
        spacing={isRow ? 2 : 0.5}
        to={'/podcasts/$podId/episodes/$episodeId'}
        params={{ podId, episodeId }}
        sx={{
          textDecoration: 'none',
          '&:visited': { color: 'textPrimary' },
          '&:hover': { color: 'textPrimary' },
          minWidth: 0,
        }}
        // {...linkProps}
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
            sx={{
              width: 52,
              height: 52,
              objectFit: 'cover',
              overflow: 'hidden',
              flex: '0 0 52px',
              borderRadius: 1,
              backgroundColor: 'rgba(0,0,0,0.08)',
              '& > img': {
                width: '100%',
              },
            }}
          >
            <img src={imgSrc} alt={`${title} cover art`} />
          </Box>
        </Box>

        <Stack direction='column' spacing={0.5} sx={{ minWidth: 0, pr: 2 }}>
          <ClampedTypography variant='body1' color='textPrimary'>
            {title}
          </ClampedTypography>
          <ClampedTypography variant='body2' color='textSecondary'>
            {secondaryText}
          </ClampedTypography>
        </Stack>
        {actionText ? (
          <Box sx={{ ml: 'auto !important', flex: `0 0 100px` }}>
            <Typography variant='body2' color='textSecondary'>
              {actionText}
            </Typography>
          </Box>
        ) : null}
      </MuiStackLink>
    </div>
  );
}
