import { convexQuery, useConvexAction } from '@convex-dev/react-query';
import { ExplicitRounded, LinkRounded, MicRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  Link,
  Rating,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { EpisodesList, EpisodesOptionsButton } from '~/components/EpisodesList';
import { FollowingButtons } from '~/components/FollowingButtons';
import { RagSearch } from '~/components/RagSearch';
import { SimilarPodcasts } from '~/components/SimilarPods';
import { SuspenseEpisodeList } from '~/components/suspense/SuspenseEpisodeRow';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
import {
  podchaserPodcast,
  type PodcastIdentifierType,
} from '~/serverFn/podchaser';
import { getRootDomain } from '~/utils/getDomain';

export const Route = createFileRoute('/_authed/podcasts_/$podId')({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params }) => {
    queryClient.prefetchQuery(
      convexQuery(api.podcasts.getPodByGuid, { id: params.podId })
    );
  },
});

function RouteComponent() {
  const { podId } = Route.useParams();

  return (
    <>
      <ErrorBoundary fallback={<div>Error loading podcast details</div>}>
        <Suspense fallback={<SuspensePodDetails />}>
          <PodDetails podId={podId} />
        </Suspense>
      </ErrorBoundary>
      <Divider sx={{ my: 3 }} />
      <Stack
        direction='row'
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
      >
        <Typography variant='h6' gutterBottom>
          Episodes
        </Typography>
        <Box>
          <EpisodesOptionsButton podId={podId} />
        </Box>
      </Stack>
      <Divider />
      <ErrorBoundary fallback={<div>Error loading episodes</div>}>
        <Suspense fallback={<SuspenseEpisodeList numItems={10} />}>
          <EpisodesList podId={podId} />
        </Suspense>
      </ErrorBoundary>
      {/* TODO: error boundary fallback / sentry */}
      <ErrorBoundary fallback={null}>
        <Suspense
          fallback={
            <>
              <Typography variant='h6' gutterBottom>
                <Skeleton />
                <SuspenseGridCards
                  numItems={8}
                  columnSpacing={2}
                  rowSpacing={1}
                  columns={16}
                  childGridProps={{ size: { xs: 8, sm: 4, md: 4, lg: 2 } }}
                />
              </Typography>
            </>
          }
        >
          <>
            <Typography variant='h6' gutterBottom>
              Similar Pods
            </Typography>
            <SimilarPodcasts podId={podId} />
          </>
        </Suspense>
      </ErrorBoundary>
      <Outlet />
      {/* <ErrorBoundary fallback={<div>search error</div>}>
        <WrappedTranscriptSearch podId={podId} />
      </ErrorBoundary> */}
      <ErrorBoundary fallback={<Typography>Error rendering search</Typography>}>
        <RagSearch podcastId={podId} />
      </ErrorBoundary>
    </>
  );
}

function PodDetails({ podId }: { podId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.podcasts.getPodByGuid, { id: podId })
  );

  const { mutate: embedPod, isPending } = useMutation({
    mutationFn: useConvexAction(api.podcasts.embedPod),
  });

  return (
    <Stack direction='row' spacing={2}>
      <Box
        component='img'
        src={data?.imageUrl || ''}
        alt={`${data?.title} cover art`}
        sx={{
          height: { xs: 100, sm: 160, md: 200 },
          width: { xs: 100, sm: 160, md: 200 },
          objectFit: 'contain',
          borderRadius: 1, // TODO: size box and render image as child ??
        }}
      />
      <Box sx={{ flex: '1 1 auto' }}>
        <Stack
          direction='row'
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant='h5'>{data?.title}</Typography>
          {data?._id && !data?.embedding ? (
            <Button
              loading={isPending}
              onClick={() => embedPod({ convexId: data._id })}
              sx={{ ml: 'auto' }}
            >
              Embed
            </Button>
          ) : null}

          {data?.podcastId ? (
            <ErrorBoundary fallback={<div />}>
              <Suspense
                fallback={
                  <Skeleton variant='rounded'>
                    <Button size='small'>Follow</Button>
                  </Skeleton>
                }
              >
                <FollowingButtons podId={data?.podcastId} />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </Stack>
        {data?.itunesId ? (
          <ErrorBoundary
            fallback={
              <Rating name='rating' value={5} disabled readOnly size='small' />
            }
          >
            <Suspense
              fallback={
                <Rating
                  name='rating'
                  value={0}
                  disabled
                  readOnly
                  size='small'
                />
              }
            >
              <PodcastRating
                podId={`${data?.itunesId}`}
                type='APPLE_PODCASTS'
              />
            </Suspense>
          </ErrorBoundary>
        ) : null}

        <Divider sx={{ my: 1 }} />
        <Stack direction='row' spacing={2}>
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <MicRounded fontSize='small' color='secondary' />
            <Typography variant='subtitle2' color='textSecondary'>
              {data?.author || data?.ownerName}
            </Typography>
          </Stack>
          {data?.link ? (
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <LinkRounded fontSize='small' color='secondary' />
              <Link
                target='_blank'
                rel='noopener noreferrer'
                href={data.link}
                underline='none'
              >
                {getRootDomain(data.link)}
              </Link>
            </Stack>
          ) : null}
          {/* <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <RadioRounded fontSize='small' color='secondary' />
            <Typography
              variant='subtitle2'
              color='textSecondary'
            >{`${data?.episodeCount} episodes`}</Typography>
          </Stack> */}
          {data?.explicit ? (
            <Tooltip title='Explicit'>
              <ExplicitRounded fontSize='small' color='error' />
            </Tooltip>
          ) : null}
        </Stack>
        <Typography variant='body2' sx={{ py: 2 }}>
          {data?.description}
        </Typography>
      </Box>
    </Stack>
  );
}

function PodcastRating({
  podId,
  type,
}: {
  podId: string;
  type: PodcastIdentifierType;
}) {
  const { data } = useSuspenseQuery({
    queryKey: ['rating', podId],
    queryFn: () => podchaserPodcast({ data: { id: podId, type } }),
  });

  return (
    <Stack direction='row' spacing={1}>
      <Rating
        name='rating'
        value={data?.podcast?.ratingAverage ?? 0}
        precision={0.05}
        readOnly
        size='small'
        sx={{ display: 'inline-flex' }}
      />
      <Typography
        variant='body2'
        fontSize={'0.775rem'}
        color='textSecondary'
      >{`(${data?.podcast?.reviewCount || 0} reviews)`}</Typography>
    </Stack>
  );
}

function SuspensePodDetails() {
  return (
    <Stack direction='row' spacing={2}>
      <Skeleton variant='rounded'>
        <Box
          height={{ xs: 100, sm: 160, md: 200 }}
          width={{ xs: 100, sm: 160, md: 200 }}
        />
      </Skeleton>
      <Box sx={{ flex: '1 1 auto' }}>
        <Stack
          direction='row'
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant='h5'>
            <Skeleton />
          </Typography>
          <Skeleton variant='rounded'>
            <Button size='small'>Follow</Button>
          </Skeleton>
        </Stack>
        <Skeleton variant='rounded'>
          <Rating size='small' />
        </Skeleton>

        <Divider sx={{ my: 1 }} />

        <Stack direction='row' spacing={2}>
          <Typography variant='subtitle2' color='textSecondary'>
            <Skeleton width={80} />
          </Typography>
          <Typography variant='subtitle2' color='textSecondary'>
            <Skeleton width={100} />
          </Typography>
        </Stack>

        <Box sx={{ py: 2 }}>
          <Typography variant='body2'>
            <Skeleton />
          </Typography>
          <Typography variant='body2'>
            <Skeleton />
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

// function WrappedTranscriptSearch({ podId }: { podId: string }) {
//   const { data } = useSuspenseQuery(
//     convexQuery(api.podcasts.getPodByGuid, { id: podId })
//   );
//   if (!data?.itunesId) return null;

//   return (
//     <TranscriptSearch
//       filters={{
//         identifiers: [{ id: `${data.itunesId}`, type: 'APPLE_PODCASTS' }],
//       }}
//     />
//   );
// }
