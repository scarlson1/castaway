import { convexQuery, useConvexAction } from '@convex-dev/react-query';
import { ExplicitRounded, LinkRounded, MicRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
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
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { EpisodesList, EpisodesOptionsButton } from '~/components/EpisodesList';
import { EpisodesTableWrapper } from '~/components/EpisodeTableWrapper';
import { ExpandableSearchBar } from '~/components/ExpandableSearchBar';
import { FollowingButtons } from '~/components/FollowingButtons';
import { PageHeader } from '~/components/PageHeader';
import { RagEpisodeResults } from '~/components/RagSearch';
import { SimilarPodcasts } from '~/components/SimilarPods';
import { SuspenseEpisodeList } from '~/components/suspense/SuspenseEpisodeRow';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
import { SuspensePodDetails } from '~/components/suspense/SuspensePodDetails';
import { useDebounce } from '~/hooks/useDebounce';
import {
  podchaserPodcast,
  type PodcastIdentifierType,
} from '~/serverFn/podchaser';
import { getRootDomain } from '~/utils/getDomain';

export const Route = createFileRoute('/_authed/podcasts_/$podId')({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params }) => {
    queryClient.prefetchQuery(
      convexQuery(api.podcasts.getPodByGuid, { id: params.podId }),
    );
  },
});

function RouteComponent() {
  const { podId } = Route.useParams();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const isSearching = Boolean(debouncedQuery.trim());

  return (
    <Box sx={{ pt: { xs: 2, md: 3 } }}>
      <PageHeader label='podcasts' />
      <ErrorBoundary fallback={<div>Error loading podcast details</div>}>
        <Suspense fallback={<SuspensePodDetails />}>
          <PodDetails podId={podId} />
        </Suspense>
      </ErrorBoundary>

      {/* Episodes header + search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          mt: { xs: 1.5, sm: 2 },
          gap: 1.5,
        }}
      >
        <Typography variant='h6' sx={{ flex: '1 1 auto' }}>
          Episodes
        </Typography>
        <ExpandableSearchBar
          value={query}
          onChange={(val) => setQuery(val)}
          placeholder='search episodes'
          endAdornment={
            <InputAdornment position='end'>
              <IconButton
                aria-label='clear search'
                onClick={() => setQuery('')}
                edge='end'
                size='small'
              >
                ×
              </IconButton>
            </InputAdornment>
          }
        />
        <EpisodesOptionsButton podId={podId} />
      </Box>

      {/* Episode list */}
      {isSearching ? (
        <ErrorBoundary fallback={<div>Error loading episodes</div>}>
          <RagEpisodeResults podcastId={podId} query={debouncedQuery} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary fallback={<div>Error loading episodes</div>}>
          <Suspense fallback={<SuspenseEpisodeList numItems={10} />}>
            {/* <EpisodesTable podId={podId} />
             */}
            <EpisodesTableWrapper>
              <EpisodesList podId={podId} />
            </EpisodesTableWrapper>
          </Suspense>
        </ErrorBoundary>
      )}

      <ErrorBoundary fallback={null}>
        <Suspense
          fallback={
            <>
              <Typography variant='h6' gutterBottom>
                <Skeleton />
              </Typography>
              <SuspenseGridCards
                numItems={8}
                columnSpacing={2}
                rowSpacing={1}
                columns={16}
                childGridProps={{ size: { xs: 8, sm: 4, md: 4, lg: 2 } }}
              />
            </>
          }
        >
          <Box sx={{ mt: 4 }}>
            <Typography variant='h6' gutterBottom>
              Similar Pods
            </Typography>
            <SimilarPodcasts podId={podId} />
          </Box>
        </Suspense>
      </ErrorBoundary>
      <Outlet />
    </Box>
  );
}

function PodDetails({ podId }: { podId: string }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.podcasts.getPodByGuid, { id: podId }),
  );

  const { mutate: embedPod, isPending } = useMutation({
    mutationFn: useConvexAction(api.podcasts.embedPod),
  });

  return (
    <Box
      sx={[
        {
          display: 'grid',
          gridTemplateColumns: { xs: '96px 1fr', sm: '200px 1fr' },
          gap: { xs: 2, sm: 3.5 },
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.75,
          mb: 3,
        },
      ]}
    >
      <Box
        component='img'
        src={data?.imageUrl || ''}
        alt={`${data?.title} cover art`}
        sx={{
          width: { xs: 96, sm: 200 },
          height: { xs: 96, sm: 200 },
          objectFit: 'cover',
          borderRadius: 1.25,
        }}
      />
      <Box>
        {/* Kicker */}
        {data?.categoryArray?.length ? (
          <Stack
            direction='row'
            spacing={1}
            divider={<span>·</span>}
            sx={{ alignItems: 'center' }}
          >
            {data.categoryArray.map((c) => (
              <Typography
                key={c}
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  mb: 1,
                }}
              >
                {c}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              mb: 1,
            }}
          >
            Podcast
          </Typography>
        )}

        {/* Title row */}
        <Stack
          direction='row'
          sx={{ alignItems: 'flex-start', gap: 1, mb: 0.5, flexWrap: 'wrap' }}
        >
          <Typography
            variant='h4'
            sx={{ flex: '1 1 auto', letterSpacing: '-0.03em' }}
          >
            {data?.title}
          </Typography>
          {data?._id && !data?.embedding ? (
            <Button
              size='small'
              loading={isPending}
              onClick={() => embedPod({ convexId: data._id })}
              sx={{ flexShrink: 0 }}
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

        {/* Rating */}
        {data?.itunesId ? (
          <ErrorBoundary
            fallback={<Rating value={5} disabled readOnly size='small' />}
          >
            <Suspense
              fallback={<Rating value={0} disabled readOnly size='small' />}
            >
              <PodcastRating
                podId={`${data?.itunesId}`}
                type='APPLE_PODCASTS'
              />
            </Suspense>
          </ErrorBoundary>
        ) : null}

        {/* Meta */}
        <Stack
          direction='row'
          spacing={2}
          sx={{ mt: 1, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <Stack direction='row' spacing={0.75} sx={{ alignItems: 'center' }}>
            <MicRounded fontSize='small' color='secondary' />
            <Typography variant='body2' color='textSecondary'>
              {data?.author || data?.ownerName}
            </Typography>
          </Stack>
          {data?.link ? (
            <Stack direction='row' spacing={0.75} sx={{ alignItems: 'center' }}>
              <LinkRounded fontSize='small' color='secondary' />
              <Link
                target='_blank'
                rel='noopener noreferrer'
                href={data.link}
                underline='hover'
                variant='body2'
              >
                {getRootDomain(data.link)}
              </Link>
            </Stack>
          ) : null}
          {data?.explicit ? (
            <Tooltip title='Explicit'>
              <ExplicitRounded fontSize='small' color='error' />
            </Tooltip>
          ) : null}
        </Stack>

        <Typography
          variant='body2'
          color='textSecondary'
          sx={{ mt: 1.5, lineHeight: 1.6 }}
        >
          {data?.description}
        </Typography>
      </Box>
    </Box>
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
    <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
      <Rating
        value={data?.podcast?.ratingAverage ?? 0}
        precision={0.05}
        readOnly
        size='small'
        sx={{ display: 'inline-flex' }}
      />
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{ fontSize: '0.775rem' }}
      >
        ({data?.podcast?.reviewCount || 0} reviews)
      </Typography>
    </Stack>
  );
}
