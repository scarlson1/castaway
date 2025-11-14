import { convexQuery, useConvexPaginatedQuery } from '@convex-dev/react-query';
import { PlayArrowRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc, type Id } from 'convex/_generated/dataModel';
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  intervalToDuration,
} from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { useQueue } from '~/hooks/useQueue';

interface EpisodesListProps {
  podId: string;
}

export const EpisodesList = ({ podId }: EpisodesListProps) => {
  const [pageSize, setPageSize] = useState(10);
  const userPlayback = useQuery(convexQuery(api.playback.getAllForUser, {}));
  console.log('userPlayback: ', userPlayback.data);

  const playbackEpisodeIds = useMemo(() => {
    return userPlayback.data?.map((p) => p.episodeId);
  }, [userPlayback.data]);

  // convex hook wrapped with react query
  const { results, status, loadMore, isLoading } = useConvexPaginatedQuery(
    api.episodes.getByPodcast,
    { podId },
    { initialNumItems: pageSize }
  );
  // convex hook
  // const { results, status, loadMore } = usePaginatedQuery(
  //   api.episodes.getByPodcast,
  //   { podId },
  //   { initialNumItems: 5 },
  // );

  const setPlaying = useQueue((state) => state.setPlaying);

  const handleSetPlaying = useCallback(
    (ep: Doc<'episodes'>) => {
      setPlaying({
        image: ep.feedImage || ep.image || '',
        episodeId: ep.episodeId,
        title: ep.title,
        audioUrl: ep.audioUrl,
        releaseDateMs: ep.publishedAt,
        podName: ep.podcastTitle,
      });
    },
    [setPlaying]
  );

  return (
    <>
      <Typography variant='h6' gutterBottom>
        Episodes
      </Typography>
      <Box>
        {results.map((e) => {
          const found = playbackEpisodeIds?.findIndex(
            (epId) => epId === e.episodeId
          );
          let playbackId: Id<'user_playback'> | undefined = undefined;
          if (found !== undefined && found >= 0)
            playbackId = userPlayback.data![found]?._id;

          console.log('e.episodeId: ', e.episodeId, found, playbackId);

          return (
            <Box key={e._id}>
              <EpisodeRow
                episode={e}
                setPlaying={handleSetPlaying}
                playbackId={playbackId}
                // playbackId={
                //   userPlayback[
                //     playbackEpisodeIds?.findIndex(
                //       (epId) => epId === e.episodeId
                //     ) || -1
                //   ]?._id
                // }
              />
              <Divider />
            </Box>
          );
        })}
      </Box>

      {status === 'CanLoadMore' ? (
        <Button
          size='small'
          onClick={() => loadMore(pageSize)}
          loading={isLoading}
        >
          Load more episodes
        </Button>
      ) : null}
      {status === 'Exhausted' ? (
        <Button size='small' disabled>
          All episodes loaded
        </Button>
      ) : null}
      <Typography variant='body2' component='div' fontSize={12}>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </Typography>
    </>
  );
};

// TODO: use tanstack table or mui X datagrid

function EpisodeRow({
  episode,
  setPlaying,
  playbackId,
}: {
  episode: Doc<'episodes'>;
  setPlaying: (ep: Doc<'episodes'>) => void;
  playbackId?: Id<'user_playback'> | null;
  // podId: string;
  // podTitle: string;
}) {
  // useQuery subscription to playback (pass the id ??)
  console.log('playbackId: ', playbackId);
  const { data: playback } = useQuery({
    ...convexQuery(api.playback.getById, {
      id: playbackId as Id<'user_playback'>,
    }),
    enabled: Boolean(playbackId),
  });

  const progress =
    playback && episode.durationSeconds
      ? (playback.positionSeconds / episode.durationSeconds) * 100
      : 100;

  if (playbackId) console.log('progress: ', progress, playback);

  return (
    <Stack
      direction='row'
      sx={{ alignItems: 'center', my: { xs: 0.5, sm: 1 } }}
    >
      <Typography color='textSecondary' sx={{ width: 80, overflow: 'hidden' }}>
        {episode.episode
          ? `E${episode.episode}`
          : episode.episodeType === 'bonus'
          ? 'bonus'
          : ''}
      </Typography>
      <Typography
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: '1 1 60%',
        }}
      >
        {episode.title}
      </Typography>
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{
          width: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {formatTimestamp(episode.publishedAt)}
      </Typography>
      <Typography variant='body2' color='textSecondary' sx={{ width: 80 }}>
        {episode.durationSeconds ? getDuration(episode.durationSeconds) : ''}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pl: 2,
        }}
      >
        {/* TODO: show pause icon and progress circle  */}
        <CircularProgress
          enableTrackSlot
          variant='determinate'
          value={progress}
          size={28}
        />
        <IconButton size='small' onClick={() => setPlaying(episode)}>
          <PlayArrowRounded fontSize='inherit' color='primary' />
        </IconButton>
      </Box>
    </Stack>
  );
}

/**
 * Format a timestamp (in milliseconds) as relative time if within a day,
 * otherwise as "MMM. d" (e.g. "Jan. 7").
 *
 * @param {number} timestampMs - The timestamp in milliseconds.
 * @returns {string} A formatted date string.
 */
function formatTimestamp(timestampMs: number) {
  const date = new Date(timestampMs);
  const now = new Date();

  const daysDiff = differenceInDays(now, date);

  if (daysDiff < 1) {
    // Within 24 hours → show relative time
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  }

  // 1 day or more → show formatted date like "Jan. 7"
  return format(date, 'MMM. d');
}

function getDuration(seconds: number) {
  const { hours, minutes } = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });
  // return formatDuration({ days, hours, minutes });
  let formatted = ``;
  if (hours) formatted += `${hours}h`;
  if (minutes) formatted += ` ${minutes}m`;
  return formatted;
}
