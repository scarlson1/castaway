import { Forward30, Replay10 } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useCallback } from 'react';
import { PlayPauseButton } from '~/components/PlayPauseButton';

interface PlaybackControlProps {
  seek: (t: number) => void;
  position: number;
  isPlaying: boolean;
  pause: () => void;
  play: () => void;
}
export function PlaybackControls({
  seek,
  position,
  isPlaying,
  pause,
  play,
}: PlaybackControlProps) {
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': {
          color: '#000',
          ...theme.applyStyles('dark', {
            color: '#fff',
          }),
        },
      })}
    >
      <IconButton
        aria-label='previous song'
        onClick={() => seek(position - 10)}
        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <Replay10 fontSize='inherit' />
      </IconButton>
      <PlayPauseButton isPlaying={isPlaying} onToggle={handlePlayPause} />
      <IconButton
        aria-label='skip 30 seconds'
        onClick={() => seek(position + 30)}
        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <Forward30 fontSize='inherit' />
      </IconButton>
    </Box>
  );
}
