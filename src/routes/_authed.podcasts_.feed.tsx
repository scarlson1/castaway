import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { TrendingCard } from '~/components/TrendingCard';

export const Route = createFileRoute('/_authed/podcasts_/feed')({
  component: RouteComponent,
});

function RouteComponent() {
  // const { data } = useSuspenseQuery(
  //   convexQuery(api.episodes.feed, { numItems: 50 })
  // );

  return (
    <Container maxWidth='md' disableGutters>
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
      </Box>
      <RecentlyUpdated />
    </Container>
  );
}

const PAGE_SIZE = 10;

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
    // error, // TODO: error handling
    fetchNextPage,
    hasNextPage,
    // isFetching,
    isFetchingNextPage,
    // status,
  } = useInfiniteQuery({
    queryKey: ['episodesFeed'],
    queryFn: fetchEpisodes,
    staleTime: 1000 * 60 * 5,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.cursor,
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
            // actionText={formatRelativeTime(new Date(ep.publishedAt))}
            publishedAt={ep.publishedAt}
            podId={ep.podcastId}
            episodeId={ep.episodeId}
            imgSrc={ep.feedImage || ep.image || ''}
            audioUrl={ep.audioUrl}
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
