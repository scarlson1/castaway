import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { MuiLink } from '~/components/MuiLink';
import { PlaybackButton } from '~/components/PlaybackButton';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { formatRelativeTime, getDuration } from '~/utils/format';

export const Route = createFileRoute('/_authed/podcasts_/feed')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box sx={{ pt: { xs: 2, md: 3 } }}>
      <Typography
        variant='h4'
        sx={{ mb: 0.5, letterSpacing: '-0.03em' }}
      >
        Today's queue.
      </Typography>
      <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
        New episodes from your subscriptions
      </Typography>
      <RecentlyUpdated />
    </Box>
  );
}

const PAGE_SIZE = 20;

function RecentlyUpdated() {
  const { convexClient } = Route.useRouteContext();
  const [ref, inView] = useInView();

  type Cursor = { publishedAt: number; episodeId: Id<'episodes'> } | null;

  const fetchEpisodes = async ({ pageParam }: { pageParam: Cursor }) => {
    const data = await convexClient.query(api.episodes.getRecentFeed, {
      pageSize: PAGE_SIZE,
      cursor: pageParam,
    });
    return data;
  };

  const { data, fetchNextPage, hasNextPage, isPending, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['episodesFeed'],
      queryFn: fetchEpisodes,
      staleTime: 1000 * 60 * 5,
      initialPageParam: null as Cursor,
      getNextPageParam: (lastPage) => lastPage.cursor,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return <FeedTableSkeleton />;
  }

  if (!data?.pages[0]?.items.length) {
    return (
      <Stack direction='column' spacing={2} sx={{ alignItems: 'center', py: 8 }}>
        <Typography variant='subtitle1' color='textSecondary'>
          Your followed podcasts will show up here
        </Typography>
        <MuiButtonLink to='/discover' variant='contained'>
          Explore
        </MuiButtonLink>
      </Stack>
    );
  }

  const allEpisodes = data.pages.flatMap((p) => p.items);

  return (
    <Box
      sx={[
        {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.25,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      ]}
    >
      {/* Table header */}
      <Box
        sx={[
          {
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: '32px 48px 1fr 160px 90px 60px 40px',
            gap: 1.75,
            alignItems: 'center',
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#f4f3ee',
          },
          (t) => t.applyStyles('dark', { bgcolor: '#1a1813' }),
        ]}
      >
        {['#', '', 'Episode', 'Show', 'When', 'Length', ''].map((h, i) => (
          <Typography
            key={i}
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {h}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      {allEpisodes.map((ep, i) => (
        <FeedRow key={ep._id} episode={ep} index={i} />
      ))}

      {/* Load more sentinel */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          ref={ref}
          size='small'
          onClick={() => fetchNextPage()}
          loading={isFetchingNextPage}
          disabled={!hasNextPage}
          sx={{ fontSize: 12, color: 'text.secondary' }}
        >
          {hasNextPage ? 'Load more' : 'All caught up'}
        </Button>
      </Box>
    </Box>
  );
}

function FeedRow({
  episode,
  index,
}: {
  episode: Doc<'episodes'>;
  index: number;
}) {
  return (
    <Box
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: { xs: '48px 1fr 40px', sm: '32px 48px 1fr 160px 90px 60px 40px' },
          gap: 1.75,
          alignItems: 'center',
          px: 2,
          py: 1.25,
          borderTop: index === 0 ? 'none' : '1px solid',
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background 0.1s',
        },
      ]}
    >
      {/* # */}
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'text.secondary',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </Typography>

      {/* Art */}
      <Box
        component='img'
        src={episode.feedImage || episode.image || ''}
        alt={episode.podcastTitle || ''}
        sx={{ width: 40, height: 40, borderRadius: 0.75, objectFit: 'cover', flexShrink: 0 }}
      />

      {/* Title + description */}
      <Box sx={{ minWidth: 0 }}>
        <MuiLink
          to='/podcasts/$podId/episodes/$episodeId'
          params={{ podId: episode.podcastId, episodeId: episode.episodeId }}
          underline='hover'
          sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {episode.title}
        </MuiLink>
        <Typography
          variant='body2'
          color='textSecondary'
          sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {episode.podcastTitle}
        </Typography>
      </Box>

      {/* Show badge */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.375,
            bgcolor: 'action.selected',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.5,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {episode.podcastTitle}
          </Typography>
        </Box>
      </Box>

      {/* When */}
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'text.secondary',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {formatRelativeTime(new Date(episode.publishedAt))}
      </Typography>

      {/* Duration */}
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'text.secondary',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {episode.durationSeconds ? getDuration(episode.durationSeconds) : '—'}
      </Typography>

      {/* Play */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Suspense fallback={<Skeleton variant='circular' width={28} height={28} />}>
          <PlaybackButton episode={episode} size='small' color='primary' />
        </Suspense>
      </Box>
    </Box>
  );
}

function FeedTableSkeleton() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.25,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'grid',
            gridTemplateColumns: '32px 48px 1fr 160px 90px 60px 40px',
            gap: 1.75,
            px: 2,
            py: 1.25,
            borderTop: i === 0 ? 'none' : '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
          }}
        >
          <Skeleton width={20} height={14} />
          <Skeleton variant='rounded' width={40} height={40} />
          <Box>
            <Skeleton width='80%' height={16} />
            <Skeleton width='50%' height={12} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton width={100} height={22} />
          <Skeleton width={50} height={14} />
          <Skeleton width={30} height={14} />
          <Skeleton variant='circular' width={28} height={28} />
        </Box>
      ))}
    </Box>
  );
}
