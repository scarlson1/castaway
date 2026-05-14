import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { Box, Dialog, DialogContent, DialogTitle, InputBase, Typography } from '@mui/material';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { format } from 'date-fns';
import { Suspense, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SIDEBAR_WIDTH } from '~/components/AppSidebar';
import { MuiLink } from '~/components/MuiLink';
import { PageHeader } from '~/components/PageHeader';
import { SimilarEpisodes } from '~/components/SimilarEpisodes';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
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

interface Chapter {
  startTime: number;
  title: string;
  img?: string;
  url?: string;
}

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
        {/* Episode header + chapters sidebar */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: chapters?.length ? '1fr 260px' : '1fr',
            },
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Left: episode info */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: { xs: 2.5, md: 3 },
            }}
          >
            {/* Metadata row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1.5,
                flexWrap: 'wrap',
              }}
            >
              {(data.feedImage || data.image) && (
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
              )}
              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                {data.podcastTitle}
              </Typography>
              {episodeLabel && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  · {episodeLabel}
                </Typography>
              )}
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                · Released {format(new Date(data.publishedAt), 'MMM d')}
              </Typography>
              {data.durationSeconds ? (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  · {getDuration(data.durationSeconds)}
                </Typography>
              ) : null}
              {adCount > 0 && (
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.125,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 0.5,
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                    lineHeight: 1.7,
                  }}
                >
                  {adCount} ad {adCount === 1 ? 'segment' : 'segments'}
                </Box>
              )}
            </Box>

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
                { label: 'Speakers', value: '—', sub: null },
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

          {/* Right: chapters sidebar */}
          {chapters?.length ? (
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                p: 2.5,
              }}
            >
              <ChaptersSidebar chapters={chapters} />
            </Box>
          ) : null}
        </Box>{' '}
        {/* closes grid */}
      </Box>{' '}
      {/* closes top flexShrink section */}
      {/* Transcript: fills remaining height, scrolls internally */}
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
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

interface AdSeg {
  start: number;
  end: number;
  duration: number;
}

interface TranscriptSeg {
  id: string | number;
  start: number;
  end: number;
  text: string;
  speaker?: string | null;
}

interface UtteranceBlock {
  speaker?: string | null;
  start: number;
  end: number;
  text: string;
  id: string | number;
}

type RowItem =
  | { type: 'chapter'; chapter: Chapter; key: string }
  | {
      type: 'segment';
      segment: TranscriptSeg | UtteranceBlock;
      ad: AdSeg | null;
      isFirstAdSegment: boolean;
    };

function TranscriptSection({
  episodeId,
  episodeConvexId,
  adSegments,
  chapters,
}: {
  episodeId: string;
  episodeConvexId: import('convex/_generated/dataModel').Id<'episodes'>;
  adSegments: AdSeg[];
  chapters: Chapter[];
}) {
  const [mode, setMode] = useState<TranscriptMode>('full');
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
            {(['Full', 'Chapters only'] as const).map((tab) => {
              const tabMode: TranscriptMode =
                tab === 'Full' ? 'full' : 'chapters';
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
          {transcript ? (
            <Box
              role='button'
              component='a'
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript.fullText || '')}`}
              download='transcript.txt'
              sx={monoLinkSx}
            >
              ↓ Export
            </Box>
          ) : (
            <Box
              role='button'
              onClick={() => !isPending && transcribeEpisode({ episodeId })}
              sx={{ ...monoLinkSx, opacity: isPending ? 0.5 : 1 }}
            >
              {isPending ? 'Transcribing…' : '+ Transcribe'}
            </Box>
          )}
        </Box>
      </Box>

      {/* Scrollable: transcript rows + similar episodes */}
      <Box sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', pb: 6 }}>
        {!transcript && (
          <Typography variant='body2' color='textSecondary'>
            No transcript available for this episode.
          </Typography>
        )}

        {transcript && mode === 'full' && (
          <FullTranscript
            episodeId={episodeId}
            segments={(transcript.segments as TranscriptSeg[]) || []}
            adSegments={adSegments}
            chapters={chapters}
            search={search}
          />
        )}

        {transcript && mode === 'chapters' && (
          <ChaptersTranscript chapters={chapters} />
        )}

        {/* Similar episodes at bottom of scroll area */}
        <Box
          sx={{
            mt: 6,
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
              <SimilarEpisodes
                limit={4}
                episodeConvexId={episodeConvexId}
                gridItemProps={{ size: { xs: 4, sm: 4 } }}
              />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}

// util function — works with OR without speaker data
function groupSegments(segments: TranscriptSeg[]): UtteranceBlock[] {
  const blocks: UtteranceBlock[] = [];

  for (const seg of segments) {
    const last = blocks.at(-1);
    const sameSpeaker =
      last && last.speaker != null && last.speaker === seg.speaker;
    const smallGap = last && seg.start - last.end < 0.8; // 1.5;

    if (last && (sameSpeaker || (!seg.speaker && smallGap))) {
      // extend current block
      last.text += seg.text;
      last.end = seg.end;
    } else {
      // new block
      blocks.push({
        speaker: seg.speaker,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        id: seg.id,
      });
    }
  }
  return blocks;
}

function FullTranscript({
  episodeId,
  segments,
  adSegments,
  chapters,
  search,
}: {
  episodeId: string;
  segments: TranscriptSeg[];
  adSegments: AdSeg[];
  chapters: Chapter[];
  search: string;
}) {
  const curEpId = useAudioStore((s) => s.episodeId);
  const position = useAudioStore((s) => s.position);
  const isActive = curEpId === episodeId;

  const groupedSegments = useMemo(() => groupSegments(segments), [segments]);

  const activeSegId = useMemo(() => {
    if (!isActive) return null;
    return groupedSegments.find((b) => position >= b.start && position < b.end)?.id ?? null;
  }, [isActive, position, groupedSegments]);

  const rows = useMemo<RowItem[]>(() => {
    const sortedChapters = [...chapters].sort(
      (a, b) => a.startTime - b.startTime,
    );
    const sortedAds = [...adSegments].sort((a, b) => a.start - b.start);
    const result: RowItem[] = [];
    let chapterIdx = 0;
    let lastAdStart = -1;

    // add segments to result, with the chapter
    for (const seg of groupedSegments) {
      while (
        chapterIdx < sortedChapters.length &&
        sortedChapters[chapterIdx].startTime <= seg.start
      ) {
        result.push({
          type: 'chapter',
          chapter: sortedChapters[chapterIdx],
          key: `ch-${chapterIdx}`,
        });
        chapterIdx++;
      }

      const ad =
        sortedAds.find((a) => seg.start >= a.start && seg.start < a.end) ||
        null;
      const isFirstAdSegment = Boolean(ad && ad.start !== lastAdStart);
      if (ad) lastAdStart = ad.start;

      result.push({ type: 'segment', segment: seg, ad, isFirstAdSegment });
    }

    return result;
  }, [groupedSegments, adSegments, chapters]);

  // const rows = useMemo<RowItem[]>(() => {
  //   const sortedChapters = [...chapters].sort(
  //     (a, b) => a.startTime - b.startTime,
  //   );
  //   const sortedAds = [...adSegments].sort((a, b) => a.start - b.start);
  //   const result: RowItem[] = [];
  //   let chapterIdx = 0;
  //   let lastAdStart = -1;

  //   // add segments to result, with the chapter
  //   for (const seg of segments) {
  //     while (
  //       chapterIdx < sortedChapters.length &&
  //       sortedChapters[chapterIdx].startTime <= seg.start
  //     ) {
  //       result.push({
  //         type: 'chapter',
  //         chapter: sortedChapters[chapterIdx],
  //         key: `ch-${chapterIdx}`,
  //       });
  //       chapterIdx++;
  //     }

  //     const ad =
  //       sortedAds.find((a) => seg.start >= a.start && seg.start < a.end) ||
  //       null;
  //     const isFirstAdSegment = Boolean(ad && ad.start !== lastAdStart);
  //     if (ad) lastAdStart = ad.start;

  //     result.push({ type: 'segment', segment: seg, ad, isFirstAdSegment });
  //   }

  //   return result;
  // }, [segments, adSegments, chapters]);

  const term = search.trim().toLowerCase();
  const visibleRows = useMemo(() => {
    if (!term) return rows;
    const matchingSegmentKeys = new Set(
      rows
        .filter(
          (r) =>
            r.type === 'segment' && r.segment.text.toLowerCase().includes(term),
        )
        .map((r) => r.type === 'segment' && String(r.segment.id)),
    );
    return rows.filter(
      (r) =>
        r.type === 'chapter' || matchingSegmentKeys.has(String(r.segment.id)),
    );
  }, [rows, term]);

  const matchCount = term
    ? visibleRows.filter((r) => r.type === 'segment').length
    : null;

  return (
    <Box>
      {matchCount !== null && (
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'text.disabled',
            mb: 1.5,
            letterSpacing: '0.06em',
          }}
        >
          {matchCount} result{matchCount !== 1 ? 's' : ''}
        </Typography>
      )}
      {visibleRows.map((row) => {
        if (row.type === 'chapter') {
          return (
            <Box
              key={row.key}
              sx={{
                py: 0.75,
                mt: 1.5,
                mb: 0.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'text.disabled',
                }}
              >
                ▲ {row.chapter.title}
              </Typography>
            </Box>
          );
        }

        const { segment, ad, isFirstAdSegment } = row;
        const isAd = Boolean(ad);
        const isCurrent = activeSegId !== null && String(segment.id) === String(activeSegId);

        return (
          <Box
            key={String(segment.id)}
            sx={[
              {
                display: 'flex',
                gap: 2,
                py: 0.625,
                borderLeft: '2px solid transparent',
                pl: 0,
                borderRadius: '0 4px 4px 0',
                transition: 'background 0.2s',
              },
              isAd && {
                borderLeftColor: 'primary.main',
                pl: 1.5,
              },
              isCurrent && !isAd && {
                borderLeftColor: 'text.primary',
                pl: 1.5,
                bgcolor: 'action.hover',
              },
            ]}
          >
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: isAd ? 'primary.main' : isCurrent ? 'text.primary' : 'text.disabled',
                minWidth: 36,
                flexShrink: 0,
                pt: 0.125,
              }}
            >
              {formatDuration(segment.start)}
            </Typography>
            <Box sx={{ flex: 1 }}>
              {isAd && isFirstAdSegment && (
                <Typography
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    color: 'primary.main',
                    mb: 0.25,
                  }}
                >
                  SPONSOR
                </Typography>
              )}
              <Typography
                sx={{
                  fontSize: 12,
                  color: isAd ? 'text.secondary' : 'text.primary',
                  lineHeight: 1.7,
                  fontWeight: isCurrent ? 500 : 400,
                }}
              >
                {segment.text}
              </Typography>
            </Box>
            {isAd && isFirstAdSegment && ad && (
              <Box
                role='button'
                onClick={() => useAudioStore.getState().seek?.(ad.end)}
                sx={{
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  mt: 0.25,
                  px: 1,
                  py: 0.25,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 0.5,
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'primary.main',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              >
                ↪ Skip · {getDuration(ad.end - ad.start)}
              </Box>
            )}
          </Box>
        );
      })}
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
function DebugJsonDialog({ label, data, open, onClose }: { label: string; data: unknown; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{label}</DialogTitle>
      <DialogContent>
        <Box
          component='pre'
          sx={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0 }}
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
      <Box role='button' onClick={() => setOpen(true)} sx={{ px: 1, py: 0.25, border: '1px dashed', borderColor: 'warning.main', borderRadius: 0.5, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'warning.main', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        transcript
      </Box>
      <DebugJsonDialog label='Raw transcript segments' data={transcript} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DebugAdsButton({ adSegments }: { adSegments: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box role='button' onClick={() => setOpen(true)} sx={{ px: 1, py: 0.25, border: '1px dashed', borderColor: 'warning.main', borderRadius: 0.5, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'warning.main', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        ads
      </Box>
      <DebugJsonDialog label='Ad segments' data={adSegments} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
