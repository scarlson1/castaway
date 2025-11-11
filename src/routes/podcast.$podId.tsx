import {
  ExplicitRounded,
  LinkRounded,
  MicRounded,
  PlayArrowRounded,
  RadioRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  Rating,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  intervalToDuration,
} from 'date-fns';
import { Suspense } from 'react';
import AudioPlayer from '~/components/AudioPlayer';
import type { EpisodeItem } from '~/lib/podcastIndexTypes';
import { fetchEpisodes, fetchPodDetails } from '~/serverFn/podcast';
import { getRootDomain } from '~/utils/getDomain';

// function getDomain(str: string) {
//   return str.match(/^(?:https?:\/\/)?(?:www\.)?([^\/:]+)/);
// }

export const podDetailsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podcast', id],
    queryFn: () => fetchPodDetails({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const Route = createFileRoute('/podcast/$podId')({
  component: RouteComponent,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(
      podDetailsQueryOptions(parseInt(params.podId))
    );
  },
});

function RouteComponent() {
  const { podId } = Route.useParams();
  const { data } = useSuspenseQuery(podDetailsQueryOptions(parseInt(podId)));

  if (!data.feed) throw new Error(`Error finding podcast with ID ${podId}`);

  return (
    <>
      <Stack direction='row' spacing={2}>
        <Box
          component='img'
          src={data?.feed?.artwork}
          alt={`${data.feed.title} cover art`}
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
            <Typography variant='h5'>{data?.feed?.title}</Typography>
            <Button>Follow</Button>
          </Stack>
          <Rating name='rating' value={5} readOnly size='small' />
          <Divider sx={{ my: 1 }} />
          <Stack direction='row' spacing={2}>
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <MicRounded fontSize='small' color='secondary' />
              <Typography variant='subtitle2' color='textSecondary'>
                {data.feed.author}
              </Typography>
            </Stack>
            {data.feed.link ? (
              <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                <LinkRounded fontSize='small' color='secondary' />
                <Link
                  target='_blank'
                  rel='noopener noreferrer'
                  href={data.feed.link}
                  underline='none'
                >
                  {getRootDomain(data.feed.link)}
                </Link>
              </Stack>
            ) : null}
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <RadioRounded fontSize='small' color='secondary' />
              <Typography
                variant='subtitle2'
                color='textSecondary'
              >{`${data.feed.episodeCount} episodes`}</Typography>
            </Stack>
            {data.feed.explicit ? (
              <Tooltip title='Explicit'>
                <ExplicitRounded fontSize='small' color='error' />
              </Tooltip>
            ) : null}
          </Stack>
          <Typography variant='body2' sx={{ py: 2 }}>
            {data.feed.description}
          </Typography>
        </Box>
      </Stack>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          // p: 3,
          // bgcolor: 'grey.900',
          // color: 'white',
          // borderRadius: 3,
        }}
      >
        <AudioPlayer
          coverArt='https://image.simplecastcdn.com/images/8ba89b80-a681-4cd2-87bd-79a6315b0474/90d6cab9-9a3e-4dd6-a633-5021470ab1c6/3000x3000/withpod-1x1.jpg?aid=rss_feed'
          id='test123'
          title='Test podcast title'
          src='https://dts.podtrac.com/redirect.mp3/pdst.fm/e/injector.simplecastaudio.com/59eb82e8-198b-4b11-b64a-c04a9083812d/episodes/3e481872-a2ab-4735-8959-3d32f0c1c1e2/audio/128/default.mp3?aid=rss_feed&awCollectionId=59eb82e8-198b-4b11-b64a-c04a9083812d&awEpisodeId=3e481872-a2ab-4735-8959-3d32f0c1c1e2&feed=Ftpd36Dg'
          releaseDate='Nov. 8'
          podName='Pod Save America'
        />
      </Box>
      <Box sx={{ py: 4 }}>
        <Suspense>
          <EpisodesList podId={parseInt(podId)} />
        </Suspense>
      </Box>
    </>
  );
}

export const episodeQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podcast', id, 'episodes'],
    queryFn: () => fetchEpisodes({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

function EpisodesList({ podId }: { podId: number }) {
  const { data } = useSuspenseQuery(episodeQueryOptions(podId));

  return (
    <Box>
      <TextField placeholder='search episodes' label='TODO: episode search' />
      {data.items.map((e) => (
        <Box key={e.id}>
          <EpisodeRow episode={e} />
          <Divider />
        </Box>
      ))}
      <Typography variant='body2' sx={{ py: 2 }} component='div'>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Typography>
    </Box>
  );
}

// TODO: use tanstack table or mui X datagrid

function EpisodeRow({ episode }: { episode: EpisodeItem }) {
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
        <IconButton size='small'>
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
