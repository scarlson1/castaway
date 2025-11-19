import { convexQuery } from '@convex-dev/react-query';
import { ExplicitRounded, LinkRounded, MicRounded } from '@mui/icons-material';
import {
  Box,
  Divider,
  Link,
  Rating,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { EpisodesList } from '~/components/EpisodesList';
import { FollowingButtons } from '~/components/FollowingButtons';
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
        <Suspense>
          <PodDetails podId={podId as Id<'podcasts'>} />
        </Suspense>
      </ErrorBoundary>
      <Divider sx={{ my: 3 }} />
      <ErrorBoundary fallback={<div>Error loading episodes</div>}>
        <Suspense>
          <EpisodesList podId={podId} />
        </Suspense>
      </ErrorBoundary>
      <Outlet />
    </>
  );
}

// TODO: move to components/

function PodDetails({ podId }: { podId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.podcasts.getPodByGuid, { id: podId })
  );

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
          {data?.podcastId ? (
            <ErrorBoundary fallback={<div />}>
              <Suspense>
                <FollowingButtons podId={data?.podcastId} />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </Stack>
        <Rating name='rating' value={5} readOnly size='small' />
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
