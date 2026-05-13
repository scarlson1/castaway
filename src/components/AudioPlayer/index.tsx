import { convexQuery } from '@convex-dev/react-query';
import { Forward30, Replay10 } from '@mui/icons-material';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Suspense, useEffect, useEffectEvent, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SkipAdButton } from '~/components/AudioPlayer/SkipAdButton';
import { MuiLink } from '~/components/MuiLink';
import { PlayPauseButton } from '~/components/PlayPauseButton';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useMediaSession } from '~/hooks/useMediaSession';
import { formatDuration } from '~/utils/format';

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
  dbPlayback = {},
}: AudioPlayerProps) {
  const loadAudio = useAudioStore((s) => s.loadAudio);
  const {
    play,
    pause,
    seek,
    setRate,
    rate,
    position,
    duration,
    isPlaying,
    episodeId,
  } = useAudioPlayer();

  useMediaSession({
    title,
    artist: podName,
    album: podName,
    artwork: coverArt,
    play,
    pause,
    seek,
    position,
    duration,
    rate,
  });

  const loadNewAudio = useEffectEvent((newId: string, newSrc: string) => {
    loadAudio(podcastId, newId, newSrc, dbPlayback);
  });

  useEffect(() => {
    loadNewAudio(id, src);
  }, [id, src]);

  return (
    <Box
      sx={[
        {
          height: 68,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '200px 1fr 180px' },
          alignItems: 'center',
          gap: { xs: 0, sm: 2 },
          px: { xs: 1.5, sm: 3 },
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backdropFilter: 'blur(16px)',
        },
      ]}
    >
      {/* Left: now playing info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          component='img'
          src={coverArt}
          alt={title}
          sx={{
            width: 42,
            height: 42,
            borderRadius: 0.75,
            flexShrink: 0,
            objectFit: 'cover',
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <MuiLink
            to='/podcasts/$podId/episodes/$episodeId'
            params={{ podId: podcastId, episodeId: episodeId || '' }}
            underline='hover'
            sx={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </MuiLink>
          <MuiLink
            to='/podcasts/$podId'
            params={{ podId: podcastId }}
            underline='hover'
            sx={{
              display: 'block',
              fontSize: 11,
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {podName}
          </MuiLink>
        </Box>
      </Box>

      {/* Center: controls + progress */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {/* Playback buttons */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'text.secondary',
          }}
        >
          <IconButton
            size='small'
            aria-label='back 10 seconds'
            onClick={() => seek(position - 10)}
            sx={{ fontSize: 16 }}
          >
            <Replay10 fontSize='inherit' />
          </IconButton>

          <Box
            role='button'
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={() => (isPlaying ? pause() : play())}
            sx={[
              {
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: 'text.primary',
                color: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: 12,
                userSelect: 'none',
              },
            ]}
          >
            {isPlaying ? '⏸' : '▶'}
          </Box>

          <IconButton
            size='small'
            aria-label='skip 30 seconds'
            onClick={() => seek(position + 30)}
            sx={{ fontSize: 16 }}
          >
            <Forward30 fontSize='inherit' />
          </IconButton>
        </Box>

        {/* Progress bar */}
        <ErrorBoundary
          fallback={
            <CompactProgressBar position={position} duration={duration} seek={seek} />
          }
        >
          <Suspense
            fallback={
              <CompactProgressBar position={position} duration={duration} seek={seek} />
            }
          >
            <CompactProgressWithAds
              episodeId={id}
              position={position}
              duration={duration}
              seek={seek}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>

      {/* Right: extra controls */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <SkipAdButton episodeId={id} seek={seek} />
          </Suspense>
        </ErrorBoundary>

        <Box
          role='button'
          onClick={() => {
            const next = rate < 1 || rate > 1.5 ? 1 : rate <= 1 ? 1.5 : 2;
            setRate(next);
          }}
          sx={{
            px: 1,
            py: 0.25,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.5,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            color: 'text.secondary',
            flexShrink: 0,
            '&:hover': { borderColor: 'text.secondary' },
          }}
        >
          {rate}×
        </Box>
      </Box>
    </Box>
  );
}

interface CompactProgressProps {
  position: number;
  duration: number;
  seek: (t: number) => void;
  marks?: Array<{ value: number; label: string }>;
}

function CompactProgressBar({ position, duration, seek, marks }: CompactProgressProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        maxWidth: 380,
      }}
    >
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'text.secondary',
          flexShrink: 0,
          minWidth: 34,
        }}
      >
        {formatDuration(position)}
      </Typography>
      <Slider
        size='small'
        value={position}
        min={0}
        max={duration || 1000}
        step={1}
        marks={marks}
        onChange={(_, val) => seek(val as number)}
        sx={(t) => ({
          color: 'text.primary',
          height: 3,
          padding: '8px 0',
          '& .MuiSlider-thumb': {
            width: 9,
            height: 9,
            '&:hover': { boxShadow: '0px 0px 0px 6px rgba(0,0,0,0.1)' },
            '&.Mui-active': { width: 14, height: 14 },
            ...t.applyStyles('dark', {
              '&:hover': { boxShadow: '0px 0px 0px 6px rgba(255,255,255,0.1)' },
            }),
          },
          '& .MuiSlider-rail': { opacity: 0.2 },
          '& .MuiSlider-mark': {
            width: 3,
            height: 3,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            opacity: 0.7,
          },
          ...t.applyStyles('dark', { color: '#fafaf7' }),
        })}
      />
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'text.secondary',
          flexShrink: 0,
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        -{formatDuration(duration - position)}
      </Typography>
    </Box>
  );
}

function CompactProgressWithAds({
  episodeId,
  ...props
}: { episodeId: string } & Omit<CompactProgressProps, 'marks'>) {
  const { data: adsData } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId }),
  );
  const marks = useMemo(
    () => adsData.map((a) => ({ value: a.start, label: '' })),
    [adsData],
  );
  return <CompactProgressBar {...props} marks={marks} />;
}
