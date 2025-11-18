import {
  convexQuery,
  useConvexAction,
  useConvexPaginatedQuery,
} from '@convex-dev/react-query';
import {
  MoreVertRounded,
  PauseRounded,
  PlayArrowRounded,
  RefreshRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc, type Id } from 'convex/_generated/dataModel';
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  intervalToDuration,
} from 'date-fns';
import { round } from 'lodash-es';
import { useCallback, useMemo, useState } from 'react';
import { MuiLink } from '~/components/MuiLink';
import { useAsyncToast } from '~/hooks/useAsyncToast';
import { useQueue } from '~/hooks/useQueue';

interface EpisodesListProps {
  podId: string;
}

export const EpisodesList = ({ podId }: EpisodesListProps) => {
  const nowPlaying = useQueue((state) => state.nowPlaying);
  const setPlaying = useQueue((state) => state.setPlaying);
  const [pageSize, setPageSize] = useState(10);
  const userPlayback = useQuery(convexQuery(api.playback.getAllForUser, {}));

  const playbackEpisodeIds = useMemo(() => {
    return userPlayback.data?.map((p) => p.episodeId);
  }, [userPlayback.data]);

  // convex hook wrapped with react query
  const { results, status, loadMore, isLoading } = useConvexPaginatedQuery(
    api.episodes.getByPodcast,
    { podId },
    { initialNumItems: pageSize }
  );

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
      <Stack
        direction='row'
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
      >
        <Typography variant='h6' gutterBottom>
          Episodes
        </Typography>
        <Box>
          <EpisodesOptionsButton podId={podId} />
        </Box>
      </Stack>
      <Divider />

      <Box>
        {results.map((e) => {
          const found = playbackEpisodeIds?.findIndex(
            (epId) => epId === e.episodeId
          );
          let playbackId: Id<'user_playback'> | undefined = undefined;
          if (found !== undefined && found >= 0)
            playbackId = userPlayback.data![found]?._id;
          // console.log('e.episodeId: ', e.episodeId, found, playbackId);

          return (
            <Box key={e._id}>
              <EpisodeRow
                episode={e}
                isPlaying={e.episodeId === nowPlaying?.episodeId}
                setPlaying={handleSetPlaying}
                playbackId={playbackId}
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
          sx={{ m: 1 }}
        >
          Load more episodes
        </Button>
      ) : null}
      {status === 'Exhausted' ? (
        <Button size='small' disabled sx={{ m: 1 }}>
          All episodes loaded
        </Button>
      ) : null}
    </>
  );
};

// TODO: use tanstack table or mui X datagrid

function getPlaybackPct(
  progress: number = 0,
  duration?: number,
  playbackPct?: number
) {
  if (playbackPct) return (1 - playbackPct) * 100;
  if (typeof duration === 'undefined' || duration <= 0) return 100;

  return round(((duration - progress) / duration) * 100, 2);
}

const iconButtonSize = 28;
const StyledIconButton = styled(IconButton)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  minWidth: iconButtonSize,
});

function EpisodeRow({
  episode,
  setPlaying,
  playbackId,
  isPlaying = false,
}: {
  episode: Doc<'episodes'>;
  setPlaying: (ep: Doc<'episodes'>) => void;
  playbackId?: Id<'user_playback'> | null;
  isPlaying?: boolean;
  // podId: string;
  // podTitle: string;
}) {
  const { data: playback } = useQuery({
    ...convexQuery(api.playback.getById, {
      id: playbackId as Id<'user_playback'>,
    }),
    enabled: Boolean(playbackId), // not working ?? fires anyway ??
  });

  const progress = playback?.playedPercentage
    ? (1 - playback.playedPercentage) * 100
    : getPlaybackPct(
        playback?.positionSeconds,
        episode.durationSeconds ?? undefined
      );

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
      <MuiLink
        to='/podcasts/$podId/episodes/$episodeId'
        params={{ podId: episode.podcastId, episodeId: episode.episodeId }}
        underline='hover'
        sx={{ flex: '1 1 auto', color: 'inherit' }}
      >
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
      </MuiLink>
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
      <Box sx={{ position: 'relative', ml: 2, height: 28, width: 28 }}>
        <CircularProgress
          enableTrackSlot
          variant='determinate'
          value={progress}
          size={iconButtonSize}
          thickness={2.4}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {isPlaying ? (
          <StyledIconButton
            size='small'
            // onClick={() => setPlaying(episode)}
            onClick={() => alert('TODO: move howler to context provider')}
          >
            <PauseRounded fontSize='inherit' color='primary' />
          </StyledIconButton>
        ) : (
          <StyledIconButton
            size='small'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPlaying(episode);
            }}
          >
            <PlayArrowRounded fontSize='inherit' color='primary' />
          </StyledIconButton>
        )}
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

const ITEM_HEIGHT = 48;

function EpisodesOptionsButton({ podId }: { podId: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const toast = useAsyncToast();

  const { mutate: refresh, isPending } = useMutation({
    mutationFn: useConvexAction(api.episodes.refreshByPodId),
    onMutate: () => toast.loading(`checking for new episodes`),
    onSuccess: ({ newEpisodes }) =>
      toast.success(`${newEpisodes} new episodes found`),
    onError: () => toast.error('something went wrong'),
  });

  const refreshEpisodes = useCallback(() => {
    refresh({ podId });
    handleClose();
  }, [handleClose, refresh]);

  return (
    <>
      <IconButton
        size='small'
        aria-label='more'
        id='episode-options-button'
        aria-controls={open ? 'episode-options-button' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleClick}
      >
        <MoreVertRounded fontSize='inherit' />
      </IconButton>
      <Menu
        id='episode-options-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              // width: '20ch',
              // width: 180,
            },
          },
          // list: {
          //   'aria-labelledby': 'long-button',
          // },
        }}
      >
        {/* {options.map((option) => ( */}
        <MenuItem disabled={isPending} onClick={() => refreshEpisodes()}>
          <ListItemIcon>
            <RefreshRounded fontSize='small' />
          </ListItemIcon>
          <ListItemText>Refresh episode list</ListItemText>
        </MenuItem>
        {/* ))} */}
      </Menu>
    </>
  );
}
