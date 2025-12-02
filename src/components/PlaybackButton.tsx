import { PauseRounded, PlayArrowRounded } from '@mui/icons-material';
import { Box, CircularProgress, IconButton, styled } from '@mui/material';
import type { Doc } from 'convex/_generated/dataModel';
import { useCallback, useMemo } from 'react';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useEpisodePlayback } from '~/hooks/useEpisodePlayback';
import { useQueueStore } from '~/hooks/useQueueStore';
import { getPlaybackPct } from '~/utils/format';

const iconButtonSize = 28;
const StyledIconButton = styled(IconButton)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  minWidth: iconButtonSize,
});

export interface PlaybackButtonProps {
  episode: Doc<'episodes'>;
}

export function PlaybackButton({ episode }: PlaybackButtonProps) {
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
    (ep: Doc<'episodes'>) => {
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
        height: iconButtonSize,
        width: iconButtonSize,
      }}
    >
      <CircularProgress
        enableTrackSlot
        variant='determinate'
        value={progress}
        size={iconButtonSize}
        thickness={2.4}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {isPlaying && isCurrentAudio ? (
        <StyledIconButton
          size='small'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlaying();
          }}
        >
          <PauseRounded fontSize='inherit' color='primary' />
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
        >
          <PlayArrowRounded fontSize='inherit' color='primary' />
        </StyledIconButton>
      )}
    </Box>
  );
}
