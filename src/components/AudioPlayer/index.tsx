import { Box, styled, Typography } from '@mui/material';
import { useEffect } from 'react';
import { PlaybackControls } from '~/components/AudioPlayer/PlaybackControls';
import { ProgressSlider } from '~/components/AudioPlayer/ProgressSlider';
import { RateButtons } from '~/components/AudioPlayer/RateButton';
import { VolumeControl } from '~/components/AudioPlayer/VolumeControl';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';
import { useAudioStore } from '~/hooks/useAudioStoreGPT';

const Widget = styled('div')(({ theme }) => ({
  padding: 16,
  // width: 343,
  maxWidth: '100%',
  margin: 'auto',
  zIndex: theme.zIndex.appBar, // theme.zIndex.drawer,
  borderTop: `1px solid ${(theme.vars || theme).palette.divider}`,
  backgroundColor: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  ...theme.applyStyles('dark', {
    // backgroundColor: 'rgba(0,0,0,0.6)',
    backgroundColor: `rgba(${theme.vars.palette.background.paper} / 0.7)`,
  }),
}));

const CoverImage = styled('div')(({ theme }) => ({
  width: 80,
  [theme.breakpoints.up('sm')]: {
    width: 100,
  },
  height: 100,
  objectFit: 'cover',
  overflow: 'hidden',
  flexShrink: 0,
  borderRadius: 8,
  backgroundColor: 'rgba(0,0,0,0.08)',
  '& > img': {
    width: '100%',
  },
}));

interface AudioPlayerProps {
  id: string;
  src: string;
  title: string;
  coverArt: string;
  podName: string;
  releaseDate: string;
  durationSeconds?: number;
  savedPosition?: number;
}

export default function AudioPlayer({
  id,
  src,
  title,
  coverArt,
  podName,
  releaseDate,
  durationSeconds,
  savedPosition = 0,
}: AudioPlayerProps) {
  const loadAudio = useAudioStore((s) => s.loadAudio);
  const {
    play,
    pause,
    toggle,
    seek,
    setVolume,
    setRate,
    rate,
    volume,
    position,
    duration,
    isPlaying,
  } = useAudioPlayer();

  // Load server + local state
  useEffect(() => {
    // loadAudio(id, src, serverState);
    console.log(`playing: ${title} - ${id}`);
    loadAudio(id, src); // TODO: server state
  }, [id, src]);

  return (
    <Widget
      sx={{
        display: 'flex',
      }}
    >
      <CoverImage>
        <img src={coverArt} alt={`${title} cover`} />
      </CoverImage>

      <PlaybackControls
        seek={seek}
        position={position}
        isPlaying={isPlaying}
        pause={pause}
        play={play}
      />

      <Box
        sx={{
          flex: '1 1 auto',
          mx: 2,
          minWidth: 0,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {/* TODO: if overflowing container --> animate in loop */}
        <Typography
          variant='h6'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {title}
        </Typography>
        <Typography
          variant='body2'
          color='textSecondary'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >{`${podName} - ${releaseDate}`}</Typography>
        {/* TODO: debug delay resetting position when src is changed */}
        <ProgressSlider position={position} duration={duration} seek={seek} />
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <RateButtons rate={rate} setRate={setRate} />
      </Box>
      <Box
        sx={{
          flex: {
            xs: '0 0 80px',
            md: '0 0 200px',
          },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <VolumeControl volume={volume} setVol={setVolume} />
      </Box>
    </Widget>
  );
}
