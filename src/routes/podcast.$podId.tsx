import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query';
import {
  AddRounded,
  ExplicitRounded,
  LinkRounded,
  MicRounded,
  PlayArrowRounded,
  RadioRounded,
  RemoveRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  Rating,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  queryOptions,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  intervalToDuration,
} from 'date-fns';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueue, type QueueItem } from '~/hooks/useQueue';
import type { EpisodeItem, PodcastFeed } from '~/lib/podcastIndexTypes';
import { fetchEpisodesByPodGuid, fetchPodDetails } from '~/serverFn/podcast';
import { getRootDomain } from '~/utils/getDomain';

export const podDetailsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podcast', id],
    queryFn: () => fetchPodDetails({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const episodesQueryOptions = (
  id: string,
  options: { max?: number } = {}
) =>
  queryOptions({
    queryKey: ['podcast', id, 'episodes', options],
    queryFn: () => fetchEpisodesByPodGuid({ data: { id, ...options } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const Route = createFileRoute('/podcast/$podId')({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params }) => {
    queryClient.prefetchQuery(podDetailsQueryOptions(parseInt(params.podId)));
    queryClient.prefetchQuery(episodesQueryOptions(params.podId, { max: 100 }));
  },
});

function RouteComponent() {
  const { podId } = Route.useParams();
  const { data } = useSuspenseQuery(podDetailsQueryOptions(parseInt(podId)));

  if (!data.feed) throw new Error(`Error finding podcast with ID ${podId}`);

  return (
    <>
      <PodDetails feed={data.feed} />

      <Box sx={{ py: 4 }}>
        {/* TODO: add error boundary */}
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <Suspense>
            <EpisodesList
              podId={data.feed.podcastGuid}
              podTitle={data.feed.title}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </>
  );
}

// TODO: unsubscribe button if following
export function PodDetails({ feed }: { feed: PodcastFeed }) {
  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: useConvexAction(api.actions.subscribe),
  });

  const { mutate: unsubscribe, isPending: unsubPending } = useMutation({
    mutationFn: useConvexMutation(api.subscribe.remove),
  });

  const { data: isFollowing, isLoading } = useQuery(
    convexQuery(api.subscribe.isFollowing, { podId: feed.podcastGuid })
  );

  return (
    <Stack direction='row' spacing={2}>
      <Box
        component='img'
        src={feed?.artwork}
        alt={`${feed.title} cover art`}
        sx={{
          height: { xs: 100, sm: 160, md: 200 },
          width: { xs: 100, sm: 160, md: 200 },
          objectFit: 'contain',
          borderRadius: 1,
          // flex:
        }}
      />
      <Box sx={{ flex: '1 1 auto' }}>
        <Stack
          direction='row'
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant='h5'>{feed?.title}</Typography>
          {!isFollowing ? (
            <Button
              loading={isPending || isLoading}
              onClick={() => subscribe({ podcastId: feed.podcastGuid })}
              startIcon={<AddRounded fontSize='inherit' />}
            >
              Follow
            </Button>
          ) : (
            <Button
              loading={unsubPending || isLoading}
              onClick={() => unsubscribe({ podId: feed.podcastGuid })}
              startIcon={<RemoveRounded fontSize='inherit' />}
            >
              Unfollow
            </Button>
          )}
        </Stack>
        <Rating name='rating' value={5} readOnly size='small' />
        <Divider sx={{ my: 1 }} />
        <Stack direction='row' spacing={2}>
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <MicRounded fontSize='small' color='secondary' />
            <Typography variant='subtitle2' color='textSecondary'>
              {feed.author}
            </Typography>
          </Stack>
          {feed.link ? (
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <LinkRounded fontSize='small' color='secondary' />
              <Link
                target='_blank'
                rel='noopener noreferrer'
                href={feed.link}
                underline='none'
              >
                {getRootDomain(feed.link)}
              </Link>
            </Stack>
          ) : null}
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <RadioRounded fontSize='small' color='secondary' />
            <Typography
              variant='subtitle2'
              color='textSecondary'
            >{`${feed.episodeCount} episodes`}</Typography>
          </Stack>
          {feed.explicit ? (
            <Tooltip title='Explicit'>
              <ExplicitRounded fontSize='small' color='error' />
            </Tooltip>
          ) : null}
        </Stack>
        <Typography variant='body2' sx={{ py: 2 }}>
          {feed.description}
        </Typography>
      </Box>
    </Stack>
  );
}

export function EpisodesList({
  podId,
  podTitle,
  limit = 100,
}: {
  podId: string;
  podTitle: string;
  limit?: number;
}) {
  const { data } = useSuspenseQuery(
    episodesQueryOptions(podId, { max: limit })
  );
  const setPlaying = useQueue((state) => state.setPlaying);

  return (
    <>
      {/* <TextField placeholder='search episodes' label='TODO: episode search' /> */}
      {data?.items?.map((e) => (
        <Box key={e.id}>
          <EpisodeRow
            episode={e}
            podId={podId}
            podTitle={podTitle}
            setPlaying={setPlaying}
          />
          <Divider />
        </Box>
      ))}
    </>
  );
}

// TODO: use tanstack table or mui X datagrid

function EpisodeRow({
  episode,
  setPlaying,
  podId,
  podTitle,
}: {
  episode: EpisodeItem;
  setPlaying: (id: QueueItem) => void;
  podId: string;
  podTitle: string;
}) {
  return (
    <Stack
      direction='row'
      sx={{ alignItems: 'center', my: { xs: 0.5, sm: 1 } }}
    >
      <Typography color='textSecondary' sx={{ width: 80, overflow: 'hidden' }}>
        {episode.episode
          ? `E${episode.episode}`
          : episode.episodeType === 'bonus'
          ? 'bonus'
          : ''}
      </Typography>
      <Typography
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: '1 1 60%',
        }}
      >
        {episode.title}
      </Typography>
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{
          width: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {formatTimestamp(episode.datePublished * 1000)}
      </Typography>
      <Typography variant='body2' color='textSecondary' sx={{ width: 80 }}>
        {episode.duration ? getDuration(episode.duration) : ''}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pl: 2,
        }}
      >
        {/* TODO: show pause icon and progress circle  */}
        <IconButton
          size='small'
          onClick={() => setPlaying({ ...episode, podId, podTitle })}
        >
          <PlayArrowRounded fontSize='inherit' color='primary' />
        </IconButton>
      </Box>
    </Stack>
  );
}

/**
 * Format a timestamp (in milliseconds) as relative time if within a day,
 * otherwise as "MMM. d" (e.g. "Jan. 7").
 *
 * @param {number} timestampMs - The timestamp in milliseconds.
 * @returns {string} A formatted date string.
 */
function formatTimestamp(timestampMs: number) {
  const date = new Date(timestampMs);
  const now = new Date();

  const daysDiff = differenceInDays(now, date);

  if (daysDiff < 1) {
    // Within 24 hours → show relative time
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  }

  // 1 day or more → show formatted date like "Jan. 7"
  return format(date, 'MMM. d');
}

function getDuration(seconds: number) {
  const { hours, minutes } = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });
  // return formatDuration({ days, hours, minutes });
  let formatted = ``;
  if (hours) formatted += `${hours}h`;
  if (minutes) formatted += ` ${minutes}m`;
  return formatted;
}
