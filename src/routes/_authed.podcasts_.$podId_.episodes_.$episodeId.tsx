import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query';
import type { WorkflowId, WorkflowStatus } from '@convex-dev/workflow';
import {
  DownloadRounded,
  HistoryEduRounded,
  IosShareRounded,
  PauseCircleFilledRounded,
  PlayCircleFilledRounded,
  PlaylistAddRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { formatDate, formatDuration } from 'date-fns';
import { Suspense, useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AdsTimeline } from '~/components/AdsTimeline';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { MuiLink } from '~/components/MuiLink';
import { SimilarEpisodes } from '~/components/SimilarEpisodes';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
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

  const { mutate: startJob, isPending: jobPending } = useMutation<
    { workflowId: string },
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
      podcastId: podId,
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
            {/* <Typography variant='overline' color='textSecondary'>
              {data?.podcastTitle}
            </Typography> */}
            <MuiLink
              to='/podcasts/$podId'
              params={{ podId }}
              underline='none'
              variant='overline'
              color='textSecondary'
            >
              {data?.podcastTitle}
            </MuiLink>
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
            <EpisodeActions
              episodeId={episodeId}
              isTranscribed={Boolean(data.detailedSummary)}
            />
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant='h6' gutterBottom>
            Episode Description{' '}
          </Typography>
          {data.detailedSummary ? (
            <Typography
              component='span'
              variant='body2'
              color='textSecondary'
              sx={{ pl: 1 }}
            >
              (AI generated summary)
            </Typography>
          ) : null}
        </Stack>
        <Typography component='div' variant='body2'>
          {data.detailedSummary ? (
            <Stack spacing={1}>
              <Typography variant='body2'>{data.detailedSummary}</Typography>
              <Divider flexItem />
              <Typography variant='overline' color='textSecondary'>
                Description from the podcast host:
              </Typography>
              <div dangerouslySetInnerHTML={{ __html: data.summary }} />
            </Stack>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: data.summary }} />
          )}
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <MuiButtonLink to='/podcasts/$podId' params={{ podId }}>
            See all episodes
          </MuiButtonLink>
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
          <EmbedEpisode convexId={data._id} />
          <ViewTranscript episodeId={episodeId} />
        </Stack>

        <Typography variant='h6' gutterBottom>
          Ads Timeline
        </Typography>
        <ErrorBoundary
          fallback={
            <Typography color='error'>Error loading ad segments</Typography>
          }
        >
          <Suspense
            fallback={
              <Typography variant='body2' color='textSecondary'>
                Loading ad segments...
              </Typography>
            }
          >
            <AdSegments
              // ads={[]} audioUrl={data.audioUrl}
              episodeId={episodeId}
            />
          </Suspense>
        </ErrorBoundary>

        <Typography variant='h6' gutterBottom>
          Ad Jobs
        </Typography>
        <ErrorBoundary
          fallback={
            <Typography color='error'>Error loading ad jobs</Typography>
          }
        >
          <Suspense
            fallback={
              <Typography variant='body2' color='textSecondary'>
                Loading ad jobs...
              </Typography>
            }
          >
            <AdJobs episodeId={episodeId} />
          </Suspense>
        </ErrorBoundary>

        <Box sx={{ py: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant='h6' gutterBottom>
            You might also like
          </Typography>
          <ErrorBoundary
            fallback={<Typography>Error loading similar episodes</Typography>}
          >
            <Suspense
              fallback={
                <SuspenseGridCards
                  numItems={4}
                  columnSpacing={2}
                  rowSpacing={1}
                  columns={16}
                  childGridProps={{ size: { xs: 8, sm: 4, md: 4, lg: 2 } }}
                />
              }
            >
              <SimilarEpisodes
                limit={4}
                episodeConvexId={data._id}
                gridItemProps={{ size: { xs: 8, sm: 4 } }}
              />
            </Suspense>
          </ErrorBoundary>
          <Divider sx={{ my: 3 }} />
        </Box>
      </Box>
    </>
  );
}

function AdSegments({ episodeId }: { episodeId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.adSegments.getByEpisodeId, { id: episodeId })
  );

  if (!data?.length)
    return (
      <Typography>
        Click the button above to analyze this episode for ads.
      </Typography>
    );

  return (
    <Box sx={{ mx: 'auto' }}>
      <AdsTimeline adSegments={data} />
    </Box>
  );
}

function EpisodeActions({
  episodeId,
  isTranscribed,
}: {
  episodeId: string;
  isTranscribed: boolean;
}) {
  const toast = useAsyncToast();
  const { mutate: transcribeEpisode, isPending: transcribePending } =
    useMutation({
      mutationFn: useConvexAction(api.transcripts.create),
      // onMutate: () => toast.loading('transcribing episode...'),
      onError: () => toast.error('error transcribing episode'),
      onSuccess: () => toast.success('episode transcription started'),
    });

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
      <Tooltip title='transcribe'>
        <IconButton
          size='small'
          loading={transcribePending}
          // disabled={isTranscribed}
          onClick={() => transcribeEpisode({ episodeId })}
        >
          <HistoryEduRounded fontSize='inherit' />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function AdJobs({ episodeId }: { episodeId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.adJobs.getByEpisodeId, { episodeId })
  );

  if (!data?.length) return <Typography>No classification jobs</Typography>;

  return (
    <>
      {data.map((j) => {
        const { transcript, ...job } = j;
        return (
          <Box key={j._id}>
            <Typography variant='overline' color='textSecondary'>
              {`Job Status ${data.length > 1 ? job._id : ''}`.trim()}
            </Typography>
            <Typography
              variant='body2'
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {`Job status: ${job.status}`}
            </Typography>

            {job.workflowId ? (
              <ErrorBoundary
                fallback={
                  <Typography>Error loading workflow status</Typography>
                }
              >
                <Suspense>
                  <WorkflowStatus workflowId={job.workflowId} />
                </Suspense>
              </ErrorBoundary>
            ) : null}
          </Box>
        );
      })}
    </>
  );
}

function WorkflowStatus({ workflowId }: { workflowId: WorkflowId }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.adPipeline.workflow.status, { workflowId })
  );

  if (!data) return <Typography>Workflow not found</Typography>;

  return (
    <>
      <Typography variant='overline' color='textSecondary'>
        Workflow Status
      </Typography>
      <Typography variant='body2'>{`Status: ${data.type}`}</Typography>

      {data.type === 'inProgress'
        ? data.running.map((step) => (
            <Typography
              variant='body2'
              key={step.name}
            >{`Step: ${step.name}`}</Typography>
          ))
        : null}

      {data.type === 'completed' ? (
        <Typography variant='body2'>{`Result: ${data.result}`}</Typography>
      ) : null}

      {data.type === 'failed' ? (
        <Typography variant='body2'>{data.error}</Typography>
      ) : null}
    </>
  );
}

function EmbedEpisode({ convexId }: { convexId: Id<'episodes'> }) {
  const toast = useAsyncToast();
  const { data } = useQuery(
    convexQuery(api.episodeEmbeddings.getEpEmbByEpId, {
      episodeConvexId: convexId,
    })
  );

  const { mutate, isPending } = useMutation({
    mutationFn: useConvexAction(api.episodeEmbeddings.generateEpisodeEmbedding),
    onMutate: () => toast.loading('generating embedding...'),
    onError: () => toast.error('error generating embedding'),
    onSuccess: () => toast.success('embedding complete'),
  });

  return (
    <Button
      loading={isPending}
      onClick={() => mutate({ episodeConvexId: convexId })}
      disabled={Boolean(data)}
    >
      Embed Episode
    </Button>
  );
}

function ViewTranscript({ episodeId }: { episodeId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useSuspenseQuery(
    convexQuery(api.transcripts.getByEpisodeId, { episodeId })
  );

  const toast = useAsyncToast();
  const { mutate: transcribeEpisode, isPending } = useMutation({
    mutationFn: useConvexAction(api.transcripts.create),
    // onMutate: () => toast.loading('transcribing episode...'),
    onError: () => toast.error('error transcribing episode'),
    onSuccess: () => toast.success('episode transcription started'),
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>View Transcript</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={!data?.fullText ? 'xs' : 'md'}
        fullWidth={!data?.fullText}
      >
        <DialogTitle>Transcript</DialogTitle>
        <DialogContent dividers>
          {data?.fullText ? (
            <Typography variant='body2' fontSize='0.875rem'>
              {data.fullText}
            </Typography>
          ) : (
            <Stack
              direction='column'
              spacing={2}
              sx={{ alignItems: 'center', py: 2 }}
            >
              <Typography>Transcript not found</Typography>
              <Button
                disabled={isPending}
                onClick={() => transcribeEpisode({ episodeId })}
                variant='contained'
              >
                Transcribe
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
