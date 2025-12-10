import { convexQuery } from '@convex-dev/react-query';
import { Box, styled } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Suspense, useEffect, useEffectEvent, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { PlaybackControls } from '~/components/AudioPlayer/PlaybackControls';
import {
  ProgressSlider,
  type ProgressSliderProps,
} from '~/components/AudioPlayer/ProgressSlider';
import { RateButtons } from '~/components/AudioPlayer/RateButton';
import { SkipAdButton } from '~/components/AudioPlayer/SkipAdButton';
import { VolumeControl } from '~/components/AudioPlayer/VolumeControl';
import { MuiLink } from '~/components/MuiLink';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';
import { useAudioStore } from '~/hooks/useAudioStore';

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
  podcastId: string;
  id: string;
  src: string;
  title: string;
  coverArt: string;
  podName: string;
  releaseDate: string;
  durationSeconds?: number;
  savedPosition?: number;
  dbPlayback?: { position?: number; duration?: number };
}

export default function AudioPlayer({
  podcastId,
  id,
  src,
  title,
  coverArt,
  podName,
  releaseDate,
  durationSeconds,
  savedPosition = 0,
  dbPlayback = {},
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
    episodeId,
  } = useAudioPlayer();

  // trigger on id/src change, but not dbPlayback
  const loadNewAudio = useEffectEvent((id, src) => {
    console.log(`load audio ${title} - ${id}`, dbPlayback);
    loadAudio(podcastId, id, src, dbPlayback);
  });

  // BUG: runs before dbPlayback is ready ??
  // Load server + local state
  useEffect(() => {
    loadNewAudio(id, src);
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

      <Box
        display='flex'
        alignItems='center'
        justifyContent='center'
        position='relative'
      >
        <ErrorBoundary fallback={<div />}>
          <Suspense>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                mt: -1,
              }}
            >
              <SkipAdButton episodeId={id} seek={seek} />
            </Box>
          </Suspense>
        </ErrorBoundary>
        <PlaybackControls
          seek={seek}
          position={position}
          isPlaying={isPlaying}
          pause={pause}
          play={play}
        />
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          mx: 2,
          minWidth: 0,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {/* TODO: if overflowing container --> animate in loop */}
        <MuiLink
          variant='h6'
          color='textPrimary'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            display: 'block',
          }}
          to='/podcasts/$podId/episodes/$episodeId'
          params={{ podId: podcastId, episodeId: episodeId || '' }}
          underline='hover'
        >
          {title}
        </MuiLink>
        <MuiLink
          variant='body2'
          color='textSecondary'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            display: 'block',
          }}
          to='/podcasts/$podId'
          params={{ podId: podcastId }}
          underline='hover'
        >{`${podName} - ${releaseDate}`}</MuiLink>
        {/* TODO: debug delay resetting position when src is changed */}
        {/* <ProgressSlider position={position} duration={duration} seek={seek} /> */}
        <SliderWithAdMarks
          position={position}
          duration={duration}
          seek={seek}
          episodeId={id}
        />
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

function SliderWithAdMarks({
  episodeId,
  ...props
}: ProgressSliderProps & { episodeId: string }) {
  const {
    data: adsData,
    isPending,
    isError,
  } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId })
  );

  const marks = useMemo(() => {
    if (isError) return [];
    return adsData.map((a) => ({ value: a.start, label: '' }));
  }, [adsData]);

  return <ProgressSlider {...props} marks={marks} />;
}
