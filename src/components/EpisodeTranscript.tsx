import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { Box, InputBase, Typography } from '@mui/material';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useMemo, useState } from 'react';
import { useAsyncToast } from '~/hooks/useAsyncToast';
import { useAudioStore } from '~/hooks/useAudioStore';
import { formatDuration, getDuration } from '~/utils/format';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptSeg {
  id: string | number;
  start: number;
  end: number;
  text: string;
  speaker?: string | null;
  adId?: Id<'ads'>;
}

export interface UtteranceBlock {
  speaker?: string | null;
  start: number;
  end: number;
  text: string;
  id: string | number;
  adId?: Id<'ads'>;
}

export type AdSeg = Doc<'ads'>;

export interface Chapter {
  startTime: number;
  title: string;
  img?: string;
  url?: string;
}

export type RowItem =
  | { type: 'chapter'; chapter: Chapter; key: string }
  | {
      type: 'segment';
      segment: TranscriptSeg | UtteranceBlock;
      ad: AdSeg | null;
      isFirstAdSegment: boolean;
      isNewSpeaker: boolean;
    };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function groupSegments(segments: TranscriptSeg[]): UtteranceBlock[] {
  const blocks: UtteranceBlock[] = [];

  for (const seg of segments) {
    const last = blocks.at(-1);
    const sameSpeaker =
      last && last.speaker != null && last.speaker === seg.speaker;
    const smallGap = last && seg.start - last.end < 0.8;
    const sameAdContext = seg.adId === last?.adId;

    if (last && (sameSpeaker || (!seg.speaker && smallGap)) && sameAdContext) {
      last.text += seg.text;
      last.end = seg.end;
    } else {
      blocks.push({
        speaker: seg.speaker,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        id: seg.id,
        adId: seg.adId,
      });
    }
  }
  return blocks;
}

function adColor(ad: AdSeg | null) {
  if (ad?.verdict === 'verified') return 'success.main';
  if (ad?.verdict === 'rejected') return 'error.main';
  return 'primary.main';
}

const skipBtnSx = {
  flexShrink: 0 as const,
  alignSelf: 'flex-start' as const,
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
  whiteSpace: 'nowrap' as const,
  '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
};

const voteBtnSx = {
  px: 0.75,
  py: 0.25,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 0.5,
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
  color: 'text.disabled',
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  userSelect: 'none' as const,
  '&:hover': { borderColor: 'text.secondary', color: 'text.secondary' },
};

// ─── FullTranscript ───────────────────────────────────────────────────────────

export function FullTranscript({
  episodeId,
  episodeConvexId,
  segments,
  adSegments,
  chapters,
  search,
  podId,
  audioUrl,
}: {
  episodeId: string;
  episodeConvexId: Id<'episodes'>;
  segments: TranscriptSeg[];
  adSegments: AdSeg[];
  chapters: Chapter[];
  search: string;
  podId: string;
  audioUrl: string;
}) {
  const curEpId = useAudioStore((s) => s.episodeId);
  const position = useAudioStore((s) => s.position);
  const isActive = curEpId === episodeId;

  const toast = useAsyncToast();
  const { data: myVotes } = useQuery(
    convexQuery(api.adFeedback.getMyVotesForEpisode, { episodeId }),
  );
  const { mutate: confirmAd } = useMutation({
    mutationFn: useConvexMutation(api.adFeedback.confirmAd),
    onError: () => toast.error('Failed to confirm ad'),
  });
  const { mutate: rejectAd } = useMutation({
    mutationFn: useConvexMutation(api.adFeedback.rejectAd),
    onError: () => toast.error('Failed to reject ad'),
  });
  const { mutate: addManualAd } = useMutation({
    mutationFn: useConvexMutation(api.adFeedback.addManualAdSegment),
    onError: () => toast.error('Failed to add ad segment'),
  });
  const { mutate: adjustBoundaries } = useMutation({
    mutationFn: useConvexMutation(api.adFeedback.adjustAdBoundaries),
    onError: () => toast.error('Failed to save boundaries'),
    onSuccess: () => setEditingAdId(null),
  });

  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState(0);
  const [editEnd, setEditEnd] = useState(0);

  const myVoteMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const vote of myVotes ?? []) {
      map.set(vote.adId, vote.action);
    }
    return map;
  }, [myVotes]);

  const groupedSegments = useMemo(
    () =>
      editingAdId !== null
        ? (segments as UtteranceBlock[])
        : groupSegments(segments),
    [segments, editingAdId],
  );

  const activeSegId = useMemo(() => {
    if (!isActive) return null;
    return (
      groupedSegments.find((b) => position >= b.start && position < b.end)
        ?.start ?? null
    );
  }, [isActive, position, groupedSegments]);

  const rows = useMemo<RowItem[]>(() => {
    const sortedChapters = [...chapters].sort(
      (a, b) => a.startTime - b.startTime,
    );
    const sortedAds = [...adSegments].sort((a, b) => a.start - b.start);
    const result: RowItem[] = [];
    let chapterIdx = 0;
    let lastAdStart: string | null = null;
    let prevSpeaker: string | null | undefined = undefined;

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

      const ad = seg.adId
        ? (sortedAds.find((a) => a._id === seg.adId) ?? null)
        : null;
      const isFirstAdSegment = Boolean(ad && ad._id !== lastAdStart);
      if (ad) lastAdStart = ad._id;

      const isNewSpeaker = seg.speaker != null && seg.speaker !== prevSpeaker;
      prevSpeaker = seg.speaker ?? prevSpeaker;

      result.push({ type: 'segment', segment: seg, ad, isFirstAdSegment, isNewSpeaker });
    }

    return result;
  }, [groupedSegments, adSegments, chapters]);

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

        const { segment, ad, isFirstAdSegment, isNewSpeaker } = row;
        const isAd = Boolean(ad);
        const isCurrent = activeSegId !== null && segment.start === activeSegId;
        const myVote = ad ? myVoteMap.get(ad._id) : undefined;
        const isInEditRange =
          editingAdId !== null &&
          segment.start >= editStart &&
          segment.start < editEnd;

        return (
          <Box
            key={segment.start}
            sx={[
              {
                display: 'flex',
                gap: 2,
                py: 0.625,
                borderLeft: '2px solid transparent',
                pl: 0,
                borderRadius: '0 4px 4px 0',
                transition: 'background 0.2s',
                '&:hover .ad-actions': { opacity: 1 },
              },
              isAd && {
                borderLeftColor: adColor(ad),
                pl: 1.5,
                opacity: ad?.verdict === 'rejected' ? 0.45 : 1,
              },
              isCurrent && !isAd && {
                borderLeftColor: 'text.primary',
                pl: 1.5,
                bgcolor: 'action.hover',
              },
              isInEditRange && {
                borderLeftColor: 'warning.main',
                pl: 1.5,
                bgcolor: (theme: any) =>
                  `color-mix(in srgb, ${theme.vars.palette.warning.main} 8%, transparent)`,
              },
            ]}
          >
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: isAd
                  ? adColor(ad)
                  : isCurrent
                    ? 'text.primary'
                    : 'text.disabled',
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
                    color: adColor(ad),
                    mb: 0.25,
                  }}
                >
                  SPONSOR
                </Typography>
              )}
              {!isAd && isNewSpeaker && segment.speaker && (
                <Typography
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    color: 'text.disabled',
                    mb: 0.25,
                    textTransform: 'uppercase',
                  }}
                >
                  {segment.speaker}
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
              {isAd && isFirstAdSegment && ad && editingAdId === String(ad._id) && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.25,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    bgcolor: 'background.default',
                  }}
                >
                  {[
                    { label: 'Start', value: editStart, onChange: setEditStart },
                    { label: 'End', value: editEnd, onChange: setEditEnd },
                  ].map(({ label, value, onChange }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          color: 'text.disabled',
                          textTransform: 'uppercase',
                          minWidth: 28,
                        }}
                      >
                        {label}
                      </Typography>
                      <InputBase
                        type='number'
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        sx={{
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                          width: 64,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 0.5,
                          px: 0.75,
                          py: 0.25,
                          '& input': { p: 0 },
                        }}
                        inputProps={{ step: 0.5 }}
                      />
                      <Typography sx={{ fontSize: 10, color: 'text.disabled', minWidth: 36 }}>
                        {formatDuration(value)}
                      </Typography>
                      <Box
                        role='button'
                        onClick={() =>
                          onChange(Math.round(useAudioStore.getState().position * 10) / 10)
                        }
                        sx={{ ...voteBtnSx, fontSize: 9 }}
                        title='Set to current playback position'
                      >
                        ↦ now
                      </Box>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25 }}>
                    <Box
                      role='button'
                      onClick={() =>
                        adjustBoundaries({ adId: ad._id, start: editStart, end: editEnd })
                      }
                      sx={{ ...voteBtnSx, color: 'success.main', borderColor: 'success.main' }}
                    >
                      Save
                    </Box>
                    <Box role='button' onClick={() => setEditingAdId(null)} sx={voteBtnSx}>
                      Cancel
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {isAd && isFirstAdSegment && ad && (
              <Box
                role='button'
                onClick={() => useAudioStore.getState().seek?.(ad.correctedEnd ?? ad.end)}
                sx={skipBtnSx}
              >
                ↪ Skip · {getDuration((ad.correctedEnd ?? ad.end) - (ad.correctedStart ?? ad.start))}
              </Box>
            )}

            {isAd && isFirstAdSegment && ad && (
              <Box
                className='ad-actions'
                sx={{
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  mt: 0.25,
                  display: 'flex',
                  gap: 0.5,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                <Box
                  role='button'
                  onClick={() => confirmAd({ adId: ad._id })}
                  title='This is an ad'
                  sx={[
                    voteBtnSx,
                    (myVote === 'confirmed' || myVote === 'manually_added') && {
                      color: 'success.main',
                      borderColor: 'success.main',
                    },
                  ]}
                >
                  ✓ {ad.verifyCount ?? 0}
                </Box>
                <Box
                  role='button'
                  onClick={() => rejectAd({ adId: ad._id })}
                  title='Not an ad'
                  sx={[
                    voteBtnSx,
                    myVote === 'rejected' && { color: 'error.main', borderColor: 'error.main' },
                  ]}
                >
                  ✕ {ad.rejectCount ?? 0}
                </Box>
                <Box
                  role='button'
                  onClick={() => {
                    setEditStart(ad.correctedStart ?? ad.start);
                    setEditEnd(ad.correctedEnd ?? ad.end);
                    setEditingAdId(editingAdId === String(ad._id) ? null : String(ad._id));
                  }}
                  title='Adjust boundaries'
                  sx={[
                    voteBtnSx,
                    editingAdId === String(ad._id) && {
                      color: 'text.primary',
                      borderColor: 'text.secondary',
                    },
                  ]}
                >
                  ✎
                </Box>
              </Box>
            )}

            {!isAd && (
              <Box
                className='ad-actions'
                sx={{
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  mt: 0.25,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                <Box
                  role='button'
                  onClick={() =>
                    addManualAd({
                      episodeId,
                      podcastId: podId,
                      convexEpId: episodeConvexId,
                      audioUrl,
                      start: segment.start,
                      end: segment.end,
                      transcriptText: segment.text,
                    })
                  }
                  title='Mark as ad'
                  sx={voteBtnSx}
                >
                  + ad
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── NowPlayingTranscript ─────────────────────────────────────────────────────
// Fetches all needed data and renders FullTranscript inside the drawer.

export function NowPlayingTranscript({
  episodeId,
  podId,
  audioUrl,
}: {
  episodeId: string;
  podId: string;
  audioUrl: string;
}) {
  const [search, setSearch] = useState('');

  const { data: episode } = useSuspenseQuery(
    convexQuery(api.episodes.getByGuid, { id: episodeId }),
  );
  const { data: transcript } = useSuspenseQuery(
    convexQuery(api.transcripts.getByEpisodeId, { episodeId }),
  );
  const { data: adSegments } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId }),
  );
  const { data: chapters } = useQuery({
    queryKey: ['chapters', episode?.chaptersUrl],
    queryFn: async (): Promise<Chapter[]> => {
      if (!episode?.chaptersUrl) return [];
      const res = await fetch(episode.chaptersUrl);
      const json = await res.json();
      return Array.isArray(json.chapters) ? json.chapters : [];
    },
    enabled: Boolean(episode?.chaptersUrl),
    staleTime: 1000 * 60 * 60,
  });

  if (!transcript?.segments?.length) {
    return (
      <Typography sx={{ fontSize: 13, color: 'text.secondary', p: 1 }}>
        No transcript available for this episode.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
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
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: 'text.disabled', fontSize: 11, lineHeight: 1 }}>»</Typography>
        <InputBase
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search transcript…'
          sx={{
            fontSize: 11,
            flex: 1,
            '& input': { p: 0 },
            '& input::placeholder': { color: 'text.disabled', opacity: 1 },
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        <FullTranscript
          episodeId={episodeId}
          episodeConvexId={episode!._id}
          segments={(transcript.segments as TranscriptSeg[]) || []}
          adSegments={adSegments || []}
          chapters={chapters || []}
          search={search}
          podId={podId}
          audioUrl={audioUrl}
        />
      </Box>
    </Box>
  );
}
