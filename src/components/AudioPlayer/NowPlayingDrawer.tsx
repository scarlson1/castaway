import { convexQuery } from '@convex-dev/react-query';
import {
  Forward30,
  Replay10,
  SkipNext,
  SkipPrevious,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Slider,
  SwipeableDrawer,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { NowPlayingTranscript } from '~/components/EpisodeTranscript';
import { useAudioStore } from '~/hooks/useAudioStore';
import { usePlayerSettings } from '~/hooks/usePlayerSettings';
import { useQueueStore } from '~/hooks/useQueueStore';
import { formatDuration } from '~/utils/format';

const MONO = "'Inter Tight', system-ui, sans-serif";
const MONO_CODE = "'JetBrains Mono', monospace";

const ACCENT = {
  light: '#a8431f',
  dark: '#e87a4a',
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function NpChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Chip
      label={label}
      size='small'
      onClick={onClick}
      variant={active ? 'filled' : 'outlined'}
      sx={(t) => ({
        fontFamily: MONO_CODE,
        fontSize: 10,
        letterSpacing: '0.06em',
        height: 28,
        borderRadius: '6px',
        borderColor: 'divider',
        bgcolor: active ? 'text.primary' : 'transparent',
        color: active ? 'background.default' : 'text.secondary',
        '& .MuiChip-label': { px: 1.25, py: 0.75 },
        cursor: 'pointer',
        ...t.applyStyles('dark', {
          borderColor: 'divider',
        }),
      })}
    />
  );
}

function NpScrubber({
  position,
  duration,
  seek,
  episodeId,
  large,
}: {
  position: number;
  duration: number;
  seek: (t: number) => void;
  episodeId: string;
  large?: boolean;
}) {
  return (
    <ErrorBoundary
      fallback={
        <SimpleScrubber
          position={position}
          duration={duration}
          seek={seek}
          large={large}
        />
      }
    >
      <Suspense
        fallback={
          <SimpleScrubber
            position={position}
            duration={duration}
            seek={seek}
            large={large}
          />
        }
      >
        <ScrubberWithAds
          episodeId={episodeId}
          position={position}
          duration={duration}
          seek={seek}
          large={large}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

function SimpleScrubber({
  position,
  duration,
  seek,
  large,
}: {
  position: number;
  duration: number;
  seek: (t: number) => void;
  large?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Slider
        size='small'
        value={position}
        min={0}
        max={duration || 1}
        step={1}
        onChange={(_, val) => seek(val as number)}
        sx={(t) => ({
          color: 'text.primary',
          height: large ? 5 : 4,
          padding: '10px 0',
          '& .MuiSlider-thumb': {
            width: large ? 13 : 11,
            height: large ? 13 : 11,
            '&:hover': { boxShadow: '0 0 0 6px rgba(0,0,0,0.1)' },
            ...t.applyStyles('dark', {
              '&:hover': { boxShadow: '0 0 0 6px rgba(255,255,255,0.1)' },
            }),
          },
          '& .MuiSlider-rail': { opacity: 0.18 },
          ...t.applyStyles('dark', { color: '#fafaf7' }),
        })}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{ fontFamily: MONO_CODE, fontSize: 11, color: 'text.secondary' }}
        >
          {formatDuration(position)}
        </Typography>
        <Typography
          sx={{ fontFamily: MONO_CODE, fontSize: 11, color: 'text.secondary' }}
        >
          -{formatDuration(Math.max(0, duration - position))}
        </Typography>
      </Box>
    </Box>
  );
}

function ScrubberWithAds({
  episodeId,
  position,
  duration,
  seek,
  large,
}: {
  episodeId: string;
  position: number;
  duration: number;
  seek: (t: number) => void;
  large?: boolean;
}) {
  const { data: ads } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId }),
  );
  const marks = ads?.map((a) => ({ value: a.start, label: '' })) ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Slider
        size='small'
        value={position}
        min={0}
        max={duration || 1}
        step={1}
        marks={marks}
        onChange={(_, val) => seek(val as number)}
        sx={(t) => ({
          color: 'text.primary',
          height: large ? 5 : 4,
          padding: '10px 0',
          '& .MuiSlider-thumb': {
            width: large ? 13 : 11,
            height: large ? 13 : 11,
            '&:hover': { boxShadow: '0 0 0 6px rgba(0,0,0,0.1)' },
            ...t.applyStyles('dark', {
              '&:hover': { boxShadow: '0 0 0 6px rgba(255,255,255,0.1)' },
            }),
          },
          '& .MuiSlider-rail': { opacity: 0.18 },
          '& .MuiSlider-mark': {
            width: 3,
            height: 3,
            borderRadius: '50%',
            bgcolor: ACCENT.light,
            opacity: 0.8,
            ...t.applyStyles('dark', { bgcolor: ACCENT.dark }),
          },
          '& .MuiSlider-markActive': {
            bgcolor: ACCENT.light,
            ...t.applyStyles('dark', { bgcolor: ACCENT.dark }),
          },
          ...t.applyStyles('dark', { color: '#fafaf7' }),
        })}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{ fontFamily: MONO_CODE, fontSize: 11, color: 'text.secondary' }}
        >
          {formatDuration(position)}
        </Typography>
        <Typography
          sx={{ fontFamily: MONO_CODE, fontSize: 11, color: 'text.secondary' }}
        >
          -{formatDuration(Math.max(0, duration - position))}
        </Typography>
      </Box>
    </Box>
  );
}

function PlayBigButton({
  isPlaying,
  onToggle,
  size = 68,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <Box
      role='button'
      aria-label={isPlaying ? 'Pause' : 'Play'}
      onClick={onToggle}
      sx={(t) => ({
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: 'text.primary',
        color: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        fontSize: size * 0.35,
        userSelect: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        transition: 'transform 0.1s ease',
        '&:active': { transform: 'scale(0.95)' },
        ...t.applyStyles('dark', { boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }),
      })}
    >
      {isPlaying ? '⏸' : '▶'}
    </Box>
  );
}

// ─── Episode description ──────────────────────────────────────────────────────

function EpisodeDescription({ episodeId }: { episodeId: string }) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <EpisodeDescriptionInner episodeId={episodeId} />
      </Suspense>
    </ErrorBoundary>
  );
}

function EpisodeDescriptionInner({ episodeId }: { episodeId: string }) {
  const { data: episode } = useSuspenseQuery(
    convexQuery(api.episodes.getByGuid, { id: episodeId }),
  );

  const summary = episode?.oneSentenceSummary ?? episode?.summary;
  if (!summary) return null;

  const text = summary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <Box
      sx={{
        px: 2,
        py: 1.75,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        mb: 2.25,
        fontSize: 13,
        lineHeight: 1.6,
        color: 'text.secondary',
        maxHeight: 140,
        overflow: 'auto',
      }}
    >
      {text}
    </Box>
  );
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

type DesktopTab = 'transcript' | 'chapters' | 'notes';

function DesktopContent({
  episode,
  position,
  duration,
  isPlaying,
  rate,
  seek,
  setRate,
  play,
  pause,
  onClose,
}: ContentProps) {
  const [tab, setTab] = useState<DesktopTab>('transcript');
  const autoSkipAds = usePlayerSettings((s) => s.autoSkipAds);
  const toggleAutoSkipAds = usePlayerSettings((s) => s.toggleAutoSkipAds);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        height: '100%',
        fontFamily: MONO,
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.75,
          px: 3.5,
          py: 2.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <IconButton
          size='small'
          onClick={onClose}
          title='Collapse (Esc)'
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          ▾
        </IconButton>

        <Typography
          sx={{
            fontFamily: MONO_CODE,
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          Now playing
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            ml: 1.75,
            minHeight: 0,
            '& .MuiTabs-root': { minHeight: 0 },
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': {
              gap: 0.5,
              p: '3px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px',
            },
          }}
        >
          {(['transcript', 'chapters', 'notes'] as DesktopTab[]).map((t) => (
            <Tab
              key={t}
              value={t}
              label={
                t === 'notes'
                  ? 'Notes & bookmarks'
                  : t.charAt(0).toUpperCase() + t.slice(1)
              }
              disableRipple
              sx={{
                minHeight: 0,
                py: 0.75,
                px: 1.75,
                fontSize: 12,
                textTransform: 'none',
                fontFamily: MONO,
                color: 'text.secondary',
                borderRadius: '5px',
                '&.Mui-selected': {
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
          ))}
        </Tabs>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
          <NpChip label='✦ Ask about this' />
          <NpChip label='⤓ Download' />
          <NpChip label='↗ Share' />
        </Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { md: '360px 1fr', lg: '440px 1fr' },
          gap: 4.5,
          px: 4.5,
          py: 4,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left: art + controls */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.75,
            minWidth: 0,
          }}
        >
          <Box
            component='img'
            src={episode.image}
            alt={episode.title}
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: '14px',
              objectFit: 'cover',
              maxWidth: 480,
            }}
          />

          <Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {episode.title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
              {episode.podName}
            </Typography>
          </Box>

          <NpScrubber
            position={position}
            duration={duration}
            seek={seek}
            episodeId={episode.episodeId}
            large
          />

          {/* Transport controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3.5,
            }}
          >
            <Box
              role='button'
              onClick={() => seek(position - 15)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <Replay10 sx={{ fontSize: 22 }} />
              <Typography
                sx={{ fontFamily: MONO_CODE, fontSize: 9, mt: '-2px' }}
              >
                15
              </Typography>
            </Box>

            <IconButton
              onClick={() => seek(Math.max(0, position - 60))}
              sx={{ color: 'text.secondary' }}
            >
              <SkipPrevious />
            </IconButton>

            <PlayBigButton
              isPlaying={isPlaying}
              onToggle={() => (isPlaying ? pause() : play())}
              size={68}
            />

            <IconButton
              onClick={() => seek(Math.min(duration, position + 60))}
              sx={{ color: 'text.secondary' }}
            >
              <SkipNext />
            </IconButton>

            <Box
              role='button'
              onClick={() => seek(position + 30)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <Forward30 sx={{ fontSize: 22 }} />
              <Typography
                sx={{ fontFamily: MONO_CODE, fontSize: 9, mt: '-2px' }}
              >
                30
              </Typography>
            </Box>
          </Box>

          {/* Secondary chips */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <NpChip
              label='⏵ auto-skip ads'
              active={autoSkipAds}
              onClick={toggleAutoSkipAds}
            />
            <NpChip
              label={`${rate}×`}
              onClick={() =>
                setRate(rate < 2 ? Math.round((rate + 0.5) * 10) / 10 : 1)
              }
            />
            <NpChip label='⏰ Sleep' />
            <NpChip label='♡ Save' />
            <NpChip label='＋ Queue' />
            <NpChip label='⌗ Bookmark' />
          </Box>
        </Box>

        {/* Right: description + tab content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1.75,
              mb: 1.75,
            }}
          >
            <Typography
              sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              About this episode
            </Typography>
            {episode.releaseDateMs ? (
              <Typography
                sx={{
                  fontFamily: MONO_CODE,
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  ml: 'auto',
                }}
              >
                {new Date(episode.releaseDateMs).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Typography>
            ) : null}
          </Box>

          <EpisodeDescription episodeId={episode.episodeId} />

          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 1.75 }}
          >
            <Typography
              sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              {tab === 'transcript'
                ? 'Transcript'
                : tab === 'chapters'
                  ? 'Chapters'
                  : 'Notes & bookmarks'}
            </Typography>
            {tab === 'transcript' && (
              <Box sx={{ ml: 'auto', display: 'flex', gap: 0.75 }}>
                <NpChip label='⌕ Find' />
                <NpChip label='⤓ Export' />
              </Box>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              p: 0.75,
            }}
          >
            {tab === 'transcript' && (
              <ErrorBoundary
                fallback={
                  <Typography
                    sx={{ p: 1, fontSize: 13, color: 'text.secondary' }}
                  >
                    Transcript unavailable
                  </Typography>
                }
              >
                <Suspense
                  fallback={
                    <Typography
                      sx={{ p: 1, fontSize: 13, color: 'text.secondary' }}
                    >
                      Loading transcript…
                    </Typography>
                  }
                >
                  <NowPlayingTranscript
                    episodeId={episode.episodeId}
                    podId={episode.podcastId}
                    audioUrl={episode.audioUrl}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {tab === 'chapters' && (
              <Typography sx={{ p: 2, fontSize: 13, color: 'text.secondary' }}>
                Chapter data not yet available.
              </Typography>
            )}
            {tab === 'notes' && (
              <Typography sx={{ p: 2, fontSize: 13, color: 'text.secondary' }}>
                No bookmarks yet. Press{' '}
                <Box
                  component='kbd'
                  sx={{
                    fontFamily: MONO_CODE,
                    fontSize: 10,
                    px: 0.75,
                    py: 0.25,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    bgcolor: 'action.hover',
                  }}
                >
                  B
                </Box>{' '}
                while listening to add one.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

type MobileTab = 'now' | 'details' | 'transcript';

function MobileContent({
  episode,
  position,
  duration,
  isPlaying,
  rate,
  seek,
  setRate,
  play,
  pause,
  onClose,
}: ContentProps) {
  const [tab, setTab] = useState<MobileTab>('now');
  const autoSkipAds = usePlayerSettings((s) => s.autoSkipAds);
  const toggleAutoSkipAds = usePlayerSettings((s) => s.toggleAutoSkipAds);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: MONO,
      }}
    >
      {/* Grab handle */}
      <Box
        sx={{
          position: 'absolute',
          top: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 42,
          height: 4,
          borderRadius: '99px',
          bgcolor: 'divider',
        }}
      />

      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          pt: 2.25,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <IconButton
          size='small'
          onClick={onClose}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ▾
        </IconButton>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            ml: 0.75,
            minHeight: 0,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': {
              gap: 0.5,
              p: '3px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px',
            },
          }}
        >
          {(['now', 'details', 'transcript'] as MobileTab[]).map((t) => (
            <Tab
              key={t}
              value={t}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
              disableRipple
              sx={{
                minHeight: 0,
                py: 0.625,
                px: 1.25,
                fontSize: 11,
                textTransform: 'none',
                fontFamily: MONO,
                color: 'text.secondary',
                borderRadius: '5px',
                '&.Mui-selected': {
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Scrollable content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: tab === 'transcript' ? 0 : 2.75,
          py: tab === 'transcript' ? 0 : 2.25,
          display: 'flex',
          flexDirection: 'column',
          gap: tab === 'transcript' ? 0 : 2.25,
        }}
      >
        {tab === 'now' && (
          <>
            <Box
              component='img'
              src={episode.image}
              alt={episode.title}
              sx={{
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: '14px',
                objectFit: 'cover',
              }}
            />
            <Box>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {episode.title}
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}
              >
                {episode.podName}
              </Typography>
            </Box>

            <NpScrubber
              position={position}
              duration={duration}
              seek={seek}
              episodeId={episode.episodeId}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Box
                role='button'
                onClick={() => seek(position - 15)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'text.secondary',
                }}
              >
                <Replay10 sx={{ fontSize: 24 }} />
                <Typography
                  sx={{ fontFamily: MONO_CODE, fontSize: 9, mt: '-2px' }}
                >
                  15
                </Typography>
              </Box>

              <PlayBigButton
                isPlaying={isPlaying}
                onToggle={() => (isPlaying ? pause() : play())}
                size={72}
              />

              <Box
                role='button'
                onClick={() => seek(position + 30)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'text.secondary',
                }}
              >
                <Forward30 sx={{ fontSize: 24 }} />
                <Typography
                  sx={{ fontFamily: MONO_CODE, fontSize: 9, mt: '-2px' }}
                >
                  30
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <NpChip
                label='⏵ auto-skip ads'
                active={autoSkipAds}
                onClick={toggleAutoSkipAds}
              />
              <NpChip
                label={`${rate}×`}
                onClick={() =>
                  setRate(rate < 2 ? Math.round((rate + 0.5) * 10) / 10 : 1)
                }
              />
              <NpChip label='⏰ Sleep' />
              <NpChip label='✦ Ask' />
            </Box>
          </>
        )}

        {tab === 'details' && (
          <>
            <Box>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {episode.title}
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}
              >
                {episode.podName}
              </Typography>
            </Box>
            <EpisodeDescription episodeId={episode.episodeId} />
          </>
        )}

        {tab === 'transcript' && (
          <ErrorBoundary
            fallback={
              <Typography
                sx={{ p: 2, fontSize: 13, color: 'text.secondary' }}
              >
                Transcript unavailable
              </Typography>
            }
          >
            <Suspense
              fallback={
                <Typography
                  sx={{ p: 2, fontSize: 13, color: 'text.secondary' }}
                >
                  Loading transcript…
                </Typography>
              }
            >
              <NowPlayingTranscript
                episodeId={episode.episodeId}
                podId={episode.podcastId}
                audioUrl={episode.audioUrl}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </Box>

      {/* Bottom action bar */}
      <Box
        sx={(t) => ({
          display: 'flex',
          justifyContent: 'space-around',
          px: 1.5,
          pt: 1.75,
          pb: 'max(22px, env(safe-area-inset-bottom))',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          flexShrink: 0,
        })}
      >
        {[
          { icon: '☼', label: 'Display' },
          { icon: 'ᴢᶻ', label: 'Sleep' },
          { icon: '⌒', label: 'AirPlay', active: true },
          { icon: '↗', label: 'Share' },
          { icon: '⋯', label: 'More' },
        ].map(({ icon, label, active }) => (
          <Box
            key={label}
            role='button'
            aria-label={label}
            sx={(t) => ({
              width: 42,
              height: 42,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              color: active ? ACCENT.light : 'text.secondary',
              cursor: 'pointer',
              ...(active && {
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }),
              ...t.applyStyles('dark', {
                color: active ? ACCENT.dark : 'text.secondary',
              }),
            })}
          >
            {icon}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Shared props ─────────────────────────────────────────────────────────────

interface ContentProps {
  episode: NonNullable<ReturnType<typeof useQueueStore.getState>['nowPlaying']>;
  position: number;
  duration: number;
  isPlaying: boolean;
  rate: number;
  seek: (t: number) => void;
  setRate: (r: number) => void;
  play: () => void;
  pause: () => void;
  onClose: () => void;
}

// ─── Root drawer ──────────────────────────────────────────────────────────────

export function NowPlayingDrawer() {
  const episode = useQueueStore((s) => s.nowPlaying);
  const open = useQueueStore((s) => s.nowPlayingOpen);
  const setOpen = useQueueStore((s) => s.setNowPlayingOpen);

  const isPlaying = useAudioStore((s) => s.isPlaying);
  const position = useAudioStore((s) => s.position);
  const duration = useAudioStore((s) => s.duration);
  const rate = useAudioStore((s) => s.rate);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const setRate = useAudioStore((s) => s.setRate);
  const registeredSeek = useAudioStore((s) => s.seek);
  const seek = (t: number) => registeredSeek?.(t);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!episode) return null;

  const iOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const sharedProps: ContentProps = {
    episode,
    position,
    duration,
    isPlaying,
    rate,
    seek,
    setRate,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    onClose: () => setOpen(false),
  };

  return (
    <SwipeableDrawer
      anchor='bottom'
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      disableDiscovery={iOS}
      disableSwipeToOpen={!isMobile}
      swipeAreaWidth={isMobile ? 64 : 0}
      slotProps={{
        paper: {
          sx: {
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0,
            bgcolor: 'background.default',
            overflow: 'hidden',
          },
        },
      }}
      sx={{ zIndex: (t) => t.zIndex.drawer + 2 }}
    >
      {isMobile ? (
        <MobileContent {...sharedProps} />
      ) : (
        <DesktopContent {...sharedProps} />
      )}
    </SwipeableDrawer>
  );
}
