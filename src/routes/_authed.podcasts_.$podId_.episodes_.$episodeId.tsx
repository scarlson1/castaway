import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query';
import {
  DownloadRounded,
  IosShareRounded,
  PauseCircleFilledRounded,
  PlayCircleFilledRounded,
  PlaylistAddRounded,
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
import { formatDate, formatDuration } from 'date-fns';
import { Suspense, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AdsTimeline } from '~/components/AdsTimeline';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { useAsyncToast } from '~/hooks/useAsyncToast';
import { useAudioStore } from '~/hooks/useAudioStore';
import { useQueueStore } from '~/hooks/useQueueStore';
import { getEpisodeLabel } from '~/routes/podcast.$podId';
import { toFormattedDuration } from '~/utils/format';

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

  const { mutate: startJob, isPending: jobPending } = useMutation<
    { jobId: string },
    Error,
    { episodeId: string; audioUrl: string }
  >({
    mutationFn: useConvexMutation(api.adPipeline.start.startAdDetection),
    onSuccess: (data, vars) => {
      console.log(data, vars);
      toast.info(`Ad detection job initiated`);
      // toast.success('test');
    },
    onError: (err, vars) => {
      console.log(err, vars);
      toast.error(`something went wrong`);
    },
  });

  const curEpId = useAudioStore(({ episodeId }) => episodeId);
  const isPlaying = useAudioStore(({ isPlaying }) => isPlaying);
  const setPlaying = useAudioStore(({ setPlaying }) => setPlaying);

  const playEpisode = useQueueStore((state) => state.setPlaying);

  const handlePlayEpisode = useCallback((ep: Doc<'episodes'>) => {
    playEpisode({
      image: ep.feedImage || ep.image || '',
      episodeId: ep.episodeId,
      title: ep.title,
      audioUrl: ep.audioUrl,
      releaseDateMs: ep.publishedAt,
      podName: ep.podcastTitle,
    });
  }, []);

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
          {isPlaying && curEpId === episodeId ? (
            <IconButton
              color='primary'
              onClick={() => setPlaying(false)}
              edge='start'
            >
              <PauseCircleFilledRounded fontSize='inherit' />
            </IconButton>
          ) : (
            <IconButton
              color='primary'
              onClick={() => handlePlayEpisode(data)}
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
          <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <MuiButtonLink to='/podcasts/$podId' params={{ podId }}>
            See all episodes
          </MuiButtonLink>
          <Button
            loading={isPending}
            onClick={() =>
              mutate({
                episodeId,
              })
            }
          >
            Transcribe & classify ads
          </Button>
          <Button
            loading={jobPending}
            onClick={() =>
              startJob({
                audioUrl: data.audioUrl,
                episodeId,
              })
            }
          >
            Transcribe & classify job
          </Button>
        </Stack>

        <Typography variant='h6' gutterBottom>
          Ads Timeline
        </Typography>
        <ErrorBoundary fallback={<div>an error occurred</div>}>
          <Suspense>
            <AdSegments
              // ads={[]} audioUrl={data.audioUrl}
              episodeId={episodeId}
            />
          </Suspense>
        </ErrorBoundary>

        <Typography variant='h6' gutterBottom>
          Ad Jobs
        </Typography>
        <ErrorBoundary fallback={<div>an error occurred</div>}>
          <Suspense>
            <AdJobs episodeId={episodeId} />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </>
  );
}

function AdSegments({ episodeId }: { episodeId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId })
  );

  return (
    <Box sx={{ mx: 'auto' }}>
      <AdsTimeline adSegments={data} />
    </Box>
  );
}

function EpisodeActions() {
  return (
    <Stack direction='row' spacing={1}>
      <Tooltip title='share'>
        <IconButton size='small' onClick={() => alert('TODO: episode actions')}>
          <IosShareRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
      <Tooltip title='download'>
        <IconButton size='small' onClick={() => alert('TODO: episode actions')}>
          <DownloadRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
      <Tooltip title='add to queue'>
        <IconButton size='small' onClick={() => alert('TODO: episode actions')}>
          <PlaylistAddRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function AdJobs({ episodeId }: { episodeId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.adJobs.getByEpisodeId, { episodeId })
  );

  if (!data?.length) return <Typography>No jobs</Typography>;

  return (
    <>
      {data.map((j) => {
        const { transcript, ...job } = j;
        return (
          <Typography component='div' variant='body2' key={j._id}>
            <pre>{JSON.stringify(job, null, 2)}</pre>
          </Typography>
        );
      })}
    </>
  );
}
