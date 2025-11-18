import { convexQuery, useConvexAction } from '@convex-dev/react-query';
import {
  DownloadRounded,
  PauseCircleFilledRounded,
  PlayCircleFilledRounded,
  QueueMusicRounded,
  ShareRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { formatDate, formatDuration, type Duration } from 'date-fns';
import { Suspense, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AdsTimeline } from '~/components/AdsTimeline';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { useAsyncToast } from '~/hooks/useAsyncToast';
import { useQueue } from '~/hooks/useQueue';
import { getEpisodeLabel } from '~/routes/podcast.$podId';

export const Route = createFileRoute(
  '/_authed/podcasts_/$podId_/episodes_/$episodeId'
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params }) => {
    queryClient.prefetchQuery(
      convexQuery(api.episodes.getByGuid, { id: params.episodeId })
    );
    queryClient.prefetchQuery(
      convexQuery(api.adSegments.getByEpisodeId, { id: params.episodeId })
    );
  },
  // onError((error, to) => {
  //   if (error.message.includes('Failed to fetch dynamically imported module')) {
  //     window.location = to.fullPath
  //   }
  // })
});

function RouteComponent() {
  const { podId, episodeId } = Route.useParams();
  const toast = useAsyncToast();

  const { data } = useSuspenseQuery(
    convexQuery(api.episodes.getByGuid, { id: episodeId })
  );

  const { mutate, isPending } = useMutation<
    { status: string },
    Error,
    { episodeId: string }
  >({
    mutationFn: useConvexAction(api.adSegments.transcribeAndClassify),
    onSuccess: (data, vars) => {
      console.log(data, vars);
      toast.info(`Ad detection process initiated`);
      // toast.success('test');
    },
    onError: (err, vars) => {
      console.log(err, vars);
      toast.error(`something went wrong`);
    },
  });

  const nowPlaying = useQueue((state) => state.nowPlaying);
  const setPlaying = useQueue((state) => state.setPlaying);

  const handleSetPlaying = useCallback(
    (ep: Doc<'episodes'>) => {
      setPlaying({
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

  if (!data) throw new Error('podcast not found');

  return (
    <>
      <Stack direction='row' spacing={4} sx={{ mb: 2 }}>
        <Box
          sx={{
            objectFit: 'contain',
            borderRadius: 1,
            overflow: 'hidden',
            '& > img': {
              width: '100%',
              borderRadius: 1,
            },
            flex: {
              xs: '0 0 120px',
              sm: '0 0 160px',
              md: '0 0 180px',
              lg: '0 0 220px',
            },
            width: {
              xs: 120,
              sm: 160,
              md: 180,
              lg: 220,
            },
          }}
        >
          <img
            src={data?.image || data?.feedImage || ''}
            alt={`${data.podcastTitle} cover`}
          />
        </Box>
        <Stack direction='column' spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Stack direction='row' spacing={2}>
            <Typography variant='overline' color='textSecondary'>
              {data?.podcastTitle}
            </Typography>
            <Typography variant='overline' color='textSecondary'>
              {getEpisodeLabel(data)}
            </Typography>
          </Stack>
          <Typography variant='h5' gutterBottom>
            {data?.title}
          </Typography>
          {nowPlaying ? (
            <IconButton
              // size='large'
              color='primary'
              onClick={() => alert('TODO: move audio controls to context')}
              edge='start'
            >
              <PauseCircleFilledRounded fontSize='inherit' />
            </IconButton>
          ) : (
            <IconButton
              // size='large'
              color='primary'
              onClick={() => handleSetPlaying(data)}
              edge='start'
            >
              <PlayCircleFilledRounded fontSize='inherit' />
            </IconButton>
          )}
        </Stack>
      </Stack>

      <Box sx={{ maxWidth: 760 }}>
        <Divider sx={{ my: 1 }} />
        <Stack
          direction='row'
          spacing={2}
          sx={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Stack direction='row' spacing={2}>
            <Typography variant='subtitle2' color='textSecondary'>
              {formatDate(new Date(data.publishedAt), 'MMM d')}
            </Typography>
            {data.durationSeconds ? (
              <Typography variant='subtitle2' color='textSecondary'>
                {formatDuration(toFormattedDuration(data.durationSeconds), {
                  format: ['hours', 'minutes'],
                  zero: false,
                })}
              </Typography>
            ) : null}
          </Stack>

          <Box sx={{ ml: 'auto' }}>
            <EpisodeActions />
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Typography variant='h6' gutterBottom>
          Episode Description
        </Typography>
        <Typography component='div' variant='body2'>
          <div dangerouslySetInnerHTML={{ __html: data.summary }} />
        </Typography>
        <MuiButtonLink to='/podcasts/$podId' params={{ podId }}>
          See all episodes
        </MuiButtonLink>
        <Button
          loading={isPending}
          onClick={() =>
            mutate({
              // podcastId: podId,
              episodeId,
              // convexEpId: data._id,
              // audioUrl: data.audioUrl,
            })
          }
        >
          Transcribe & classify ads
        </Button>

        <ErrorBoundary fallback={<div>an error occurred</div>}>
          <Suspense>
            <AdSegments
              // ads={[]} audioUrl={data.audioUrl}
              episodeId={episodeId}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </>
  );
}

function AdSegments({
  // ads,
  // audioUrl,
  episodeId,
}: {
  // ads: { start: number; end: number }[];
  // audioUrl: string;
  episodeId: string;
}) {
  const { data } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId })
  );

  return (
    <Box sx={{ mx: 'auto' }}>
      <Typography variant='h6' gutterBottom>
        Ads Timeline
      </Typography>
      <AdsTimeline adSegments={data} />

      <p className='text-sm text-gray-600 mb-4'>
        Audio:{' '}
        <a className='text-blue-500' href={data[0]?.audioUrl}>
          {data[0]?.audioUrl || ''}
        </a>
      </p>

      {data?.map(({ confidence, duration, start, end, transcript, _id }) => (
        <Typography variant='body2' component='div' key={_id}>
          <pre>
            {JSON.stringify(
              { confidence, duration, start, end, transcript },
              null,
              2
            )}
          </pre>
        </Typography>
      ))}

      {/* {data?.ads?.length === 0 ? (
        <p>No ads detected 🎉</p>
      ) : (
        <ul className='list-disc pl-6 space-y-2'>
          {data?.ads.map((a, i) => (
            <li key={i}>
              {format(a.start)} → {format(a.end)}
            </li>
          ))}
        </ul>
      )} */}
    </Box>
  );
}

function EpisodeActions() {
  return (
    <Stack direction='row' spacing={1}>
      <Tooltip title='share'>
        <IconButton size='small' onClick={() => alert('TODO: episode actions')}>
          <ShareRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
      <Tooltip title='download'>
        <IconButton size='small' onClick={() => alert('TODO: episode actions')}>
          <DownloadRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
      <Tooltip title='add to queue'>
        <IconButton size='small' onClick={() => alert('TODO: episode actions')}>
          <QueueMusicRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toFormattedDuration(s: number): Duration {
  const hours = Math.floor(s / 3600);
  const mRemain = s % 3600;
  const minutes = Math.floor(mRemain / 60);
  const sRemain = mRemain % 60;
  const seconds = Math.floor(sRemain / 60);

  return { hours, minutes, seconds };
}
