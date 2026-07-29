import { useConvexPaginatedQuery } from '@convex-dev/react-query';
import {
  Box,
  Button,
  Skeleton,
  Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense } from 'react';
import { useInView } from 'react-intersection-observer';
import { PlaybackButton } from '~/components/PlaybackButton';
import { PageHeader } from '~/components/PageHeader';
import { MuiLink } from '~/components/MuiLink';
import { formatRelativeTime, getDuration } from '~/utils/format';
import type { Doc } from 'convex/_generated/dataModel';

export const Route = createFileRoute('/_authed/podcasts_/progress')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box sx={{ pt: { xs: 2, md: 3 } }}>
      <PageHeader label='in-progress' />
      <Typography variant='h4' sx={{ mb: 0.5, letterSpacing: '-0.03em' }}>
        In Progress.
      </Typography>
      <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
        Episodes you've started
      </Typography>
      <Suspense fallback={<ProgressTableSkeleton />}>
        <UserPlayback />
      </Suspense>
    </Box>
  );
}

const PAGE_SIZE = 10;

function UserPlayback() {
  const [ref, inView] = useInView();

  const { results, status, loadMore } = useConvexPaginatedQuery(
    api.playback.inProgress,
    {},
    { initialNumItems: PAGE_SIZE },
  );

  if (!results?.length) {
    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.25,
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <Typography variant='body2' color='textSecondary'>
          No episodes in progress
        </Typography>
      </Box>
    );
  }

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
      {/* Table header */}
      <Box
        sx={[
          {
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: '48px 1fr 90px 60px 40px',
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
        {['', 'Episode', 'When', 'Length', ''].map((h, i) => (
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
      {results.map((ep, i) => (
        <ProgressRow key={ep._id} episode={ep} index={i} />
      ))}

      {/* Load more */}
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
          onClick={() => loadMore(PAGE_SIZE)}
          loading={status === 'LoadingMore'}
          disabled={status !== 'CanLoadMore'}
          sx={{ fontSize: 12, color: 'text.secondary' }}
        >
          {status === 'CanLoadMore' ? 'Load more' : 'All caught up'}
        </Button>
      </Box>
    </Box>
  );
}

type ProgressEpisode = Omit<Doc<'episodes'>, '_id' | '_creationTime'> & Omit<Doc<'user_playback'>, keyof Omit<Doc<'episodes'>, '_id' | '_creationTime'>>;

function ProgressRow({ episode, index }: { episode: ProgressEpisode; index: number }) {
  return (
    <Box
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: { xs: '48px 1fr 40px', sm: '48px 1fr 90px 60px 40px' },
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
      {/* Art */}
      <Box
        component='img'
        src={episode.feedImage || episode.image || ''}
        alt={episode.podcastTitle || ''}
        sx={{ width: 40, height: 40, borderRadius: 0.75, objectFit: 'cover', flexShrink: 0 }}
      />

      {/* Title + podcast */}
      <Box sx={{ minWidth: 0 }}>
        <MuiLink
          to='/podcasts/$podId/episodes/$episodeId'
          params={{ podId: episode.podcastId, episodeId: episode.episodeId }}
          underline='hover'
          sx={{
            color: 'text.primary',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
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

function ProgressTableSkeleton() {
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
      {Array.from({ length: 6 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 90px 60px 40px',
            gap: 1.75,
            px: 2,
            py: 1.25,
            borderTop: i === 0 ? 'none' : '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
          }}
        >
          <Skeleton variant='rounded' width={40} height={40} />
          <Box>
            <Skeleton width='75%' height={16} />
            <Skeleton width='45%' height={12} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton width={50} height={14} />
          <Skeleton width={30} height={14} />
          <Skeleton variant='circular' width={28} height={28} />
        </Box>
      ))}
    </Box>
  );
}
