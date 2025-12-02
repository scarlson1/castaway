import { useConvexPaginatedQuery } from '@convex-dev/react-query';
import {
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense } from 'react';
import { useInView } from 'react-intersection-observer';
import { TrendingCard } from '~/components/TrendingCard';

export const Route = createFileRoute('/_authed/podcasts_/progress')({
  component: RouteComponent,
  // TODO: preload data
});

function RouteComponent() {
  return (
    <Box>
      <Typography variant='h5' gutterBottom>
        In Progress
      </Typography>
      {/* <ErrorBoundary fallback=> */}
      <Suspense>
        <UserPlayback />
      </Suspense>
      {/* </ErrorBoundary> */}
    </Box>
  );
}

const PAGE_SIZE = 10;
// use join episode data or pass episode ID to component and look up individually ??
function UserPlayback() {
  const [ref, inView] = useInView();

  const { results, status, loadMore, isLoading } = useConvexPaginatedQuery(
    api.playback.inProgress,
    {},
    { initialNumItems: PAGE_SIZE }
  );

  // if (!results?.length)
  //   return <Typography>No playback history found</Typography>;

  return (
    <>
      <Stack direction='column' spacing={1} divider={<Divider />}>
        {results.map((ep) => (
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
            duration={ep.durationSeconds}
          />
        ))}
      </Stack>
      {status !== 'Exhausted' ? (
        <Button
          ref={ref}
          onClick={() => loadMore(PAGE_SIZE)}
          loading={isLoading}
          disabled={isLoading || status !== 'CanLoadMore'}
          sx={{ mt: 2 }}
        >
          {`${status === 'CanLoadMore' ? 'Load more' : 'fetching...'}`}
        </Button>
      ) : null}
    </>
  );
}

// function WrappedEpisodeRow({ playback }: { playback: Doc<'user_playback'> }) {
//   const { data: episode } = useSuspenseQuery(
//     convexQuery(api.episodes.getByGuid, { id: playback.episodeId })
//   );

//   if (!episode) return null;

//   return <EpisodeRow episode={episode} playback={playback} />;
// }

function EpisodeRowSkeleton({ orientation }: { orientation: string }) {
  let isRow = orientation === 'horizontal';
  return (
    <Stack direction={isRow ? 'row' : 'column'} spacing={isRow ? 2 : 0.5}>
      <Skeleton variant='rounded' width={52} height={52} />
      <Stack direction='column' spacing={0.5} sx={{ minWidth: 0, pr: 2 }}>
        <Skeleton variant='text' sx={{ fontSize: '1rem' }} />
        <Skeleton variant='text' sx={{ fontSize: '0.825rem' }} />
        <Box sx={{ ml: 'auto !important', flex: `0 0 100px` }}>
          <Skeleton variant='text' sx={{ fontSize: '0.825rem' }} />
        </Box>
      </Stack>
    </Stack>
  );
}
