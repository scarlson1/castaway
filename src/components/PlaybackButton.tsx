import { PauseRounded, PlayArrowRounded } from '@mui/icons-material';
import {
  alpha,
  Box,
  CircularProgress,
  IconButton,
  styled,
  type IconButtonProps,
} from '@mui/material';
import type { Doc } from 'convex/_generated/dataModel';
import { useCallback, useMemo } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useEpisodePlayback } from '~/hooks/useEpisodePlayback';
import { useQueueStore } from '~/hooks/useQueueStore';
import { getPlaybackPct } from '~/utils/format';

const iconButtonSize = 24;
const progressThickness = 2;
const circleSize = iconButtonSize + progressThickness * 2 - 1;
const StyledIconButton = styled(IconButton)({
  // position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  minWidth: iconButtonSize,
  height: iconButtonSize,
  width: iconButtonSize,
  color: '#fff',
  backgroundColor: alpha('#363D49', 0.5),
  '&:hover': {
    color: '#3A4D73',
    backgroundColor: '#fff',
  },
  '&:hover .MuiSvgIcon-root': {
    color: '#3A4D73',
  },
});

type EpisodeRequired = Pick<
  Doc<'episodes'>,
  | 'audioUrl'
  | 'episodeId'
  | 'feedImage'
  | 'podcastId'
  | 'podcastTitle'
  | 'title'
  | 'publishedAt'
> & { [key: string]: any };

export interface PlaybackButtonProps extends Omit<IconButtonProps, 'onClick'> {
  episode: EpisodeRequired;
}

export function PlaybackButton({
  episode,
  color = 'default',
  ...props
}: PlaybackButtonProps) {
  const nowPlaying = useQueueStore((state) => state.nowPlaying);
  const setPlaying = useQueueStore((state) => state.setPlaying);
  const { isPlaying, setPlaying: p } = useAudioStore();

  const playback = useEpisodePlayback(episode.episodeId);

  const isCurrentAudio = useMemo(
    () => episode.episodeId === nowPlaying?.episodeId,
    [episode.episodeId, nowPlaying]
  );

  // for progress indicator - 100 if episode has not been played
  const progress = useMemo(() => {
    return playback?.playedPercentage
      ? (1 - playback.playedPercentage) * 100
      : getPlaybackPct(
          playback?.positionSeconds,
          episode?.durationSeconds ?? undefined
        );
  }, [episode, playback]);

  const togglePlaying = useCallback(() => {
    p(!isPlaying);
  }, [p, isPlaying]);

  const handleSetPlaying = useCallback(
    (ep: EpisodeRequired) => {
      setPlaying({
        podcastId: ep.podcastId,
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
    <Box
      sx={{
        position: 'relative',
        ml: 2,
        height: circleSize, // iconButtonSize,
        width: circleSize, // iconButtonSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // color,
      }}
    >
      <CircularProgress
        enableTrackSlot
        variant='determinate'
        value={progress}
        size={circleSize}
        thickness={2}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        color={color === 'default' ? 'inherit' : color}
      />
      {isPlaying && isCurrentAudio ? (
        <StyledIconButton
          size='small'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlaying();
          }}
          color={color}
          {...props}
        >
          <PauseRounded fontSize='inherit' color='inherit' />
        </StyledIconButton>
      ) : (
        <StyledIconButton
          size='small'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isCurrentAudio) {
              togglePlaying(); // TODO: remove queue store and use audio directly ??
            } else {
              handleSetPlaying(episode);
            }
          }}
          color={color}
          {...props}
        >
          <PlayArrowRounded fontSize='inherit' color='inherit' />
        </StyledIconButton>
      )}
    </Box>
  );
}
