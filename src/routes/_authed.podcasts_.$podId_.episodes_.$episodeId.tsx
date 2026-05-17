import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  InputBase,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { format } from 'date-fns';
import { Suspense, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AdsTimeline } from '~/components/AdsTimeline';
import { SIDEBAR_WIDTH } from '~/components/AppSidebar';
import {
  type AdSeg,
  type Chapter,
  FullTranscript,
  type TranscriptSeg,
} from '~/components/EpisodeTranscript';
import { MuiLink } from '~/components/MuiLink';
import { PageHeader } from '~/components/PageHeader';
import { SimilarEpisodes } from '~/components/SimilarEpisodes';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
import { TypographyLink } from '~/components/TypographyLink';
import { useAsyncToast } from '~/hooks/useAsyncToast';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useQueueStore } from '~/hooks/useQueueStore';
import { formatDuration, getDuration } from '~/utils/format';

export const Route = createFileRoute(
  '/_authed/podcasts_/$podId_/episodes_/$episodeId',
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params }) => {
    queryClient.prefetchQuery(
      convexQuery(api.episodes.getByGuid, { id: params.episodeId }),
    );
    queryClient.prefetchQuery(
      convexQuery(api.adSegments.getByEpisodeId, { id: params.episodeId }),
    );
  },
});

function useChapters(chaptersUrl?: string | null) {
  return useQuery({
    queryKey: ['chapters', chaptersUrl],
    queryFn: async (): Promise<Chapter[]> => {
      if (!chaptersUrl) return [];
      const res = await fetch(chaptersUrl);
      const json = await res.json();
      return Array.isArray(json.chapters) ? json.chapters : [];
    },
    enabled: Boolean(chaptersUrl),
    staleTime: 1000 * 60 * 60,
  });
}

function RouteComponent() {
  const { podId, episodeId } = Route.useParams();

  const { data } = useSuspenseQuery(
    convexQuery(api.episodes.getByGuid, { id: episodeId }),
  );
  const { data: playback } = useQuery(
    convexQuery(api.playback.getByEpisodeId, { episodeId }),
  );
  const { data: adSegments } = useQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId }),
  );
  const { data: chapters } = useChapters(data?.chaptersUrl);
  const { data: transcript } = useQuery(
    convexQuery(api.transcripts.getByEpisodeId, { episodeId }),
  );

  const curEpId = useAudioStore((s) => s.episodeId);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const playEpisode = useQueueStore((s) => s.setPlaying);

  if (!data) throw new Error('episode not found');

  const isCurrentEpisode = curEpId === episodeId;
  const resumePosition =
    playback?.positionSeconds && playback.positionSeconds > 30
      ? playback.positionSeconds
      : null;

  const handlePlay = () => {
    if (isCurrentEpisode) {
      setPlaying(!isPlaying);
    } else {
      playEpisode({
        podcastId: podId,
        image: data.feedImage || data.image || '',
        episodeId: data.episodeId,
        title: data.title,
        audioUrl: data.audioUrl,
        releaseDateMs: data.publishedAt,
        podName: data.podcastTitle,
      });
    }
  };

  let episodeLabel = '';
  if (data.episodeType === 'bonus') {
    episodeLabel = 'bonus';
  } else {
    if (data.season) episodeLabel += `S${data.season} `;
    if (data.episode) episodeLabel += `#${data.episode}`;
    episodeLabel = episodeLabel.trim();
  }

  const adCount = adSegments?.length ?? 0;
  const totalAdSeconds = useMemo(
    () => adSegments?.reduce((sum, a) => sum + (a.end - a.start), 0) ?? 0,
    [adSegments],
  );

  const description = useMemo(() => {
    if (data.oneSentenceSummary) return data.oneSentenceSummary;
    if (!data.summary) return null;
    const text = data.summary
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 300 ? text.slice(0, 300) + '…' : text;
  }, [data.oneSentenceSummary, data.summary]);

  const toast = useAsyncToast();
  const { mutate: classifyAds, isPending: classifyPending } = useMutation({
    mutationFn: useConvexMutation(api.adPipeline.start.startAdDetection),
    onSuccess: () => toast.info('Ad detection job initiated'),
    onError: () => toast.error('Something went wrong'),
  });

  const actionBtnSx = {
    display: 'inline-flex',
    alignItems: 'center',
    px: 1.5,
    py: 0.75,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 0.75,
    fontSize: 12,
    cursor: 'pointer',
    color: 'text.secondary',
    userSelect: 'none',
    textDecoration: 'none',
    '&:hover': { color: 'text.primary', borderColor: 'text.secondary' },
  } as const;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 'var(--Castaway-header-height)',
        bottom: {
          xs: 'calc(var(--Castaway-bottom-nav-height) + var(--Castaway-audio-player-height, 0px))',
          md: 'var(--Castaway-audio-player-height, 0px)',
        },
        left: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Top: breadcrumb + episode card */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 3, md: 4.5 },
          pt: { xs: 2, md: 2.5 },
          pb: 2,
        }}
      >
        <PageHeader
          label={
            data.podcastTitle?.toLowerCase().replace(/\s+/g, '-') ?? 'podcasts'
          }
        />
        {/* Episode header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: chapters?.length
              ? { xs: '1fr', md: '1fr 260px' }
              : data?.image
                ? { xs: '1fr', md: '1fr 25%' }
                : '1fr',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 2.5, md: 3 } }}>
            {/* Metadata row */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.75,
                mb: { xs: 1, sm: 1.5 },
              }}
            >
              <Stack
                direction='row'
                spacing={1}
                sx={{
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
                divider={<Typography variant='body2'>{'·'}</Typography>}
              >
                <Stack
                  direction='row'
                  spacing={1}
                  sx={{ alignItems: 'center' }}
                >
                  {data.feedImage || data.image ? (
                    <Box
                      component='img'
                      src={data.feedImage || data.image || ''}
                      alt={data.podcastTitle}
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: 0.375,
                        flexShrink: 0,
                        objectFit: 'cover',
                      }}
                    />
                  ) : null}
                  <TypographyLink
                    to='/podcasts/$podId'
                    params={{ podId: data.podcastId }}
                    sx={{ fontSize: 12, fontWeight: 500 }}
                  >
                    {data.podcastTitle}
                  </TypographyLink>
                </Stack>
                {episodeLabel && (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {episodeLabel}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Released {format(new Date(data.publishedAt), 'MMM d')}
                </Typography>
                {data.durationSeconds ? (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {getDuration(data.durationSeconds)}
                  </Typography>
                ) : null}

                {adCount > 0 ? (
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.125,
                      color: 'primary.main',
                      border: (theme) =>
                        `1px solid ${theme.vars.palette.primary.main}`,
                      borderRadius: 0.5,
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.04em',
                      lineHeight: 1.7,
                    }}
                  >
                    {adCount} ad {adCount === 1 ? 'segment' : 'segments'}
                  </Box>
                ) : null}
              </Stack>
            </Box>
            {/* </Box> */}

            {/* Title */}
            <Typography
              variant='h4'
              sx={{ mb: 1.25, letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              {data.title}
            </Typography>

            {/* Description */}
            {description && (
              <Typography
                variant='body2'
                color='textSecondary'
                sx={{ mb: 2.5, lineHeight: 1.7 }}
              >
                {description}
              </Typography>
            )}

            {/* Stats row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.5,
                py: 1.75,
                my: 2,
                mx: { xs: -2.5, md: -3 },
                px: { xs: 2.5, md: 3 },
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              {[
                {
                  label: 'Listened',
                  value: playback?.positionSeconds
                    ? formatDuration(playback.positionSeconds)
                    : '—',
                  sub: data.durationSeconds
                    ? `/ ${formatDuration(data.durationSeconds)}`
                    : null,
                },
                {
                  label: 'Chapters',
                  value: chapters?.length ? String(chapters.length) : '—',
                  sub: data.chaptersUrl ? '· auto' : null,
                },
                {
                  label: 'Ads Detected',
                  value: String(adCount),
                  sub:
                    totalAdSeconds > 0
                      ? `· ${getDuration(totalAdSeconds)}`
                      : null,
                },
                {
                  label: 'Speakers',
                  value: (() => {
                    const speakers = new Set(
                      (transcript?.segments ?? [])
                        .map((s) => (s as TranscriptSeg).speaker)
                        .filter(Boolean),
                    );
                    return speakers.size > 0 ? String(speakers.size) : '—';
                  })(),
                  sub: null,
                },
              ].map(({ label, value, sub }) => (
                <Box key={label}>
                  <Typography
                    sx={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'text.disabled',
                      mb: 0.375,
                    }}
                  >
                    {label}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 0.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {value}
                    </Typography>
                    {sub && (
                      <Typography
                        sx={{ fontSize: 11, color: 'text.secondary' }}
                      >
                        {sub}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Box
                role='button'
                onClick={handlePlay}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'text.primary',
                  color: 'background.default',
                  borderRadius: 0.75,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  userSelect: 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                {isCurrentEpisode && isPlaying ? '⏸' : '▶'}{' '}
                {resumePosition
                  ? `Resume at ${formatDuration(resumePosition)}`
                  : 'Play'}
              </Box>
              <Box role='button' sx={actionBtnSx}>
                + Save
              </Box>
              <Box
                role='button'
                component='a'
                href={data.audioUrl}
                download
                sx={actionBtnSx}
              >
                ↓ Download
              </Box>
              <MuiLink
                to='/chat'
                sx={{
                  ...actionBtnSx,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                    borderColor: 'text.secondary',
                  },
                }}
              >
                + Ask about this
              </MuiLink>
              {adCount === 0 && (
                <Box
                  role='button'
                  onClick={() =>
                    !classifyPending &&
                    classifyAds({ audioUrl: data.audioUrl, episodeId })
                  }
                  sx={{
                    ...actionBtnSx,
                    opacity: classifyPending ? 0.5 : 1,
                  }}
                >
                  {classifyPending ? 'Classifying…' : '⚙ Classify ads'}
                </Box>
              )}
            </Box>
          </Box>

          {chapters?.length ? (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                p: 2.5,
              }}
            >
              <ChaptersSidebar chapters={chapters} />
            </Box>
          ) : data?.image ? (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'flex-start',
                p: 2.5,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  maxHeight: '100%',
                  overflow: 'hidden',
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              >
                <Box
                  component='img'
                  src={data.image}
                  alt={`${data?.title} cover art`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Box>
          ) : null}
        </Box>
      </Box>

      {/* closes top flexShrink section */}
      {/* Transcript: fills remaining height, scrolls internally */}
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 120,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, sm: 3, md: 4.5 },
          pb: 2,
        }}
      >
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <TranscriptSection
              episodeId={episodeId}
              episodeConvexId={data._id}
              adSegments={adSegments || []}
              chapters={chapters || []}
              podId={podId}
              audioUrl={data.audioUrl}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}

function ChaptersSidebar({ chapters }: { chapters?: Chapter[] }) {
  if (!chapters?.length) return null;

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          mb: 1,
        }}
      >
        Chapters
      </Typography>
      {chapters.map((ch, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 0.875,
            px: 1,
            mx: -0.5,
            borderRadius: 0.75,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'text.disabled',
              flexShrink: 0,
              minWidth: 36,
            }}
          >
            {formatDuration(ch.startTime)}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ch.title}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

type TranscriptMode = 'full' | 'chapters';

function TranscriptSection({
  episodeId,
  episodeConvexId,
  adSegments,
  chapters,
  podId,
  audioUrl,
}: {
  episodeId: string;
  episodeConvexId: Id<'episodes'>;
  adSegments: AdSeg[];
  chapters: Chapter[];
  podId: string;
  audioUrl: string;
}) {
  const [mode, setMode] = useState<TranscriptMode | 'ads'>('full');
  const [search, setSearch] = useState('');
  const { data: transcript } = useSuspenseQuery(
    convexQuery(api.transcripts.getByEpisodeId, { episodeId }),
  );
  const toast = useAsyncToast();
  const { mutate: transcribeEpisode, isPending } = useMutation({
    mutationFn: useConvexMutation(api.transcripts.create),
    onError: () => toast.error('error transcribing episode'),
    onSuccess: () => toast.success('episode transcription started'),
  });

  const monoLinkSx = {
    px: 1.25,
    py: 0.375,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 0.5,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    color: 'text.secondary',
    textDecoration: 'none',
    userSelect: 'none',
    '&:hover': { color: 'text.primary', borderColor: 'text.secondary' },
  } as const;

  return (
    <Box
      sx={{
        flex: '1 1 auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid',
        borderColor: 'divider',
        pt: 2.5,
      }}
    >
      {/* Header (fixed, doesn't scroll) */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          Transcript
        </Typography>
        {transcript && (
          <Box sx={{ display: 'flex', gap: 0 }}>
            {(['Full', 'Chapters only', 'Ads'] as const).map((tab) => {
              const tabMode: TranscriptMode | 'ads' =
                tab === 'Full' ? 'full' : tab === 'Ads' ? 'ads' : 'chapters';
              return (
                <Box
                  key={tab}
                  role='button'
                  onClick={() => setMode(tabMode)}
                  sx={[
                    {
                      px: 1.25,
                      py: 0.375,
                      borderRadius: 0.5,
                      fontSize: 12,
                      cursor: 'pointer',
                      userSelect: 'none',
                    },
                    mode === tabMode
                      ? { bgcolor: 'action.selected', color: 'text.primary' }
                      : {
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' },
                        },
                  ]}
                >
                  {tab}
                </Box>
              );
            })}
          </Box>
        )}
        <Box
          sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.75 }}
        >
          <DebugTranscriptButton transcript={transcript} />
          <DebugAdsButton adSegments={adSegments} />
          {transcript && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.375,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.5,
                bgcolor: 'background.default',
              }}
            >
              <Typography
                sx={{
                  color: 'text.disabled',
                  fontSize: 11,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                »
              </Typography>
              <InputBase
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search transcript…'
                sx={{
                  fontSize: 11,
                  width: 160,
                  '& input': { p: 0 },
                  '& input::placeholder': {
                    color: 'text.disabled',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          )}
          {/* {transcript ? // <Box
          //   role='button'
          //   component='a'
          //   href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript.fullText || '')}`}
          //   download='transcript.txt'
          //   sx={monoLinkSx}
          // >
          //   ↓ Export
          // </Box>
          null : ( */}
          <Box
            role='button'
            onClick={() => {
              if (isPending) return; // TODO: use mui button with disable once theme updated ??
              const forceTranscribe = transcript
                ? confirm(
                    'Transcription exist. Would you like to retranscribe?',
                  )
                : false;
              transcribeEpisode({ episodeId, forceTranscribe });
            }}
            sx={{
              ...monoLinkSx,
              color: transcript ? 'text.secondary' : 'disabled',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isPending ? 'Transcribing…' : '+ Transcribe'}
          </Box>
          {/* )} */}
        </Box>
      </Box>

      {/* Scrollable: transcript rows */}
      <Box
        sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', pb: 6, pr: 1 }}
      >
        {!transcript && (
          <Typography variant='body2' color='textSecondary'>
            No transcript available for this episode.
          </Typography>
        )}

        {transcript && mode === 'full' && (
          <FullTranscript
            episodeId={episodeId}
            episodeConvexId={episodeConvexId}
            segments={(transcript.segments as TranscriptSeg[]) || []}
            adSegments={adSegments}
            chapters={chapters}
            search={search}
            podId={podId}
            audioUrl={audioUrl}
          />
        )}

        {transcript && mode === 'chapters' && (
          <ChaptersTranscript chapters={chapters} />
        )}
        {Boolean(adSegments?.length) && mode === 'ads' ? (
          <AdsTimeline adSegments={adSegments} />
        ) : null}
      </Box>
      {/* Similar episodes */}
      <Box
        sx={{
          mt: 3,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' sx={{ mb: 2.5, letterSpacing: '-0.02em' }}>
          You might also like
        </Typography>
        <ErrorBoundary fallback={null}>
          <Suspense
            fallback={
              <SuspenseGridCards
                numItems={4}
                columnSpacing={2}
                rowSpacing={1}
                columns={16}
                childGridProps={{ size: { xs: 4, sm: 4, md: 4, lg: 2 } }}
              />
            }
          >
            <Box sx={{ maxWidth: 600 }}>
              <SimilarEpisodes
                limit={4}
                episodeConvexId={episodeConvexId}
                gridItemProps={{ size: { xs: 4, sm: 4 } }}
              />
            </Box>
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}

function ChaptersTranscript({ chapters }: { chapters: Chapter[] }) {
  if (!chapters.length) {
    return (
      <Typography variant='body2' color='textSecondary'>
        No chapter information available.
      </Typography>
    );
  }

  return (
    <Box>
      {chapters.map((ch, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover': { '& .ch-title': { color: 'text.primary' } },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'text.disabled',
              minWidth: 40,
              flexShrink: 0,
            }}
          >
            {formatDuration(ch.startTime)}
          </Typography>
          <Typography
            className='ch-title'
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              transition: 'color 0.1s',
            }}
          >
            {ch.title}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// DEBUG — remove when done investigating ad/transcript grouping
function DebugJsonDialog({
  label,
  data,
  open,
  onClose,
}: {
  label: string;
  data: unknown;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle
        sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
      >
        {label}
      </DialogTitle>
      <DialogContent>
        <Box
          component='pre'
          sx={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            m: 0,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function DebugTranscriptButton({ transcript }: { transcript: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        role='button'
        onClick={() => setOpen(true)}
        sx={{
          px: 1,
          py: 0.25,
          border: '1px dashed',
          borderColor: 'warning.main',
          borderRadius: 0.5,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'warning.main',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        transcript
      </Box>
      <DebugJsonDialog
        label='Raw transcript segments'
        data={transcript}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function DebugAdsButton({ adSegments }: { adSegments: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        role='button'
        onClick={() => setOpen(true)}
        sx={{
          px: 1,
          py: 0.25,
          border: '1px dashed',
          borderColor: 'warning.main',
          borderRadius: 0.5,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'warning.main',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ads
      </Box>
      <DebugJsonDialog
        label='Ad segments'
        data={adSegments}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
