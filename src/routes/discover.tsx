import { convexQuery } from '@convex-dev/react-query';
import { ArrowForwardIos, OpenInNewRounded } from '@mui/icons-material';
import {
  Box,
  Divider,
  Grid,
  Link,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense, useId, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Authed } from '~/components/Authed';
import { Card } from '~/components/Card';
import { Featured } from '~/components/Featured';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { RecommendedEpisodes } from '~/components/RecommendedEpisodes';
import { SimilarPodcasts } from '~/components/SimilarPods';
import { SubscribeIconButtonITunes } from '~/components/SubscribeIconButtonITunes';
import { SuspenseFeaturedSection } from '~/components/suspense/SuspenseFeaturedSection';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
import { trendingQueryOptions } from '~/queries';
import { fetchSpotifyPlaylist } from '~/serverFn/spotify';

// TODO: add category selection at top of page

export const Route = createFileRoute('/discover')({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    // seed cache, but don't block
    queryClient.prefetchQuery(trendingQueryOptions({ max: 8 }));
    // queryClient.prefetchQuery(appleChartsQueryOptions({ limit: 10 }));
  },
});

function RouteComponent() {
  return (
    <Stack direction='column' spacing={3}>
      <Typography variant='h4' component='h2' gutterBottom>
        Discover
      </Typography>
      <ErrorBoundary
        fallback={
          <Typography color='error'>
            Failed to load featured podcasts
          </Typography>
        }
      >
        <Suspense fallback={<SuspenseFeaturedSection />}>
          <Featured />
        </Suspense>
      </ErrorBoundary>

      <Divider />

      <Stack
        direction='row'
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'center', my: 3 }}
      >
        <Typography variant='h6' gutterBottom>
          Trending
        </Typography>
        <MuiButtonLink
          to='/trending'
          size='small'
          endIcon={<ArrowForwardIos fontSize='small' />}
        >
          See all
        </MuiButtonLink>
      </Stack>
      {/* <Grid container spacing={3} sx={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)'}}> */}
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Suspense fallback={<TrendingSectionSkeleton />}>
          <Trending />
        </Suspense>
      </ErrorBoundary>

      <Divider />

      <Authed>
        <SimilarToLastListened />
      </Authed>

      <Divider />

      <Authed>
        <Box>
          <Typography variant='overline' lineHeight={1.2} color='textSecondary'>
            Based on your listening
          </Typography>
          <Typography variant='h6' gutterBottom>
            Episodes you might like
          </Typography>
        </Box>

        <ErrorBoundary fallback={<div>Error loading recommendations</div>}>
          <RecommendedEpisodes limit={8} />
        </ErrorBoundary>
      </Authed>

      <Divider />

      <Stack
        direction='row'
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant='h5' gutterBottom fontWeight={500}>
          Independent Podcast Award Winners 2025
        </Typography>
        <Link
          href='https://open.spotify.com/playlist/1JnNZjQfEXEJVF9fqwVCb6'
          underline='none'
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          See all <OpenInNewRounded fontSize='small' sx={{ ml: 0.5 }} />
        </Link>
      </Stack>

      <ErrorBoundary fallback={<div>Error loading spotify data</div>}>
        <Suspense fallback={<SuspenseGridCards numItems={8} />}>
          <IndependentPodcastAwardWinners
            playlistId='1JnNZjQfEXEJVF9fqwVCb6'
            limit={16}
          />
        </Suspense>
      </ErrorBoundary>
    </Stack>
  );
}

function Trending() {
  const {
    data: { feeds },
  } = useSuspenseQuery(trendingQueryOptions({ max: 8 }));

  return (
    <Grid
      container
      rowSpacing={1}
      columnSpacing={3}
      // sx={{
      //   display: 'grid',
      //   gridTemplateRows: 'repeat(4, 1fr)',
      //   gridTemplateColumns: {
      //     xs: 'repeat(1, minmax(0px, 1fr))',
      //     sm: 'repeat(2, minmax(0px, 1fr))',
      //   },
      //   gridAutoRows: 0,
      //   overflow: 'hidden',
      //   rowGap: 0, // add margin bottom to child grid container
      // }}
    >
      {feeds.map((pod) => (
        <Grid
          size={{ xs: 12, sm: 6 }}
          // sx={{ width: 'unset !important', mb: 1 }}
          key={pod.id}
        >
          <Card
            orientation='horizontal'
            imgSrc={pod.artwork || ''}
            title={pod.title}
            subtitle={pod.author}
            linkProps={{
              to: '/podcast/$podId',
              params: { podId: `${pod.id}` },
            }}
          >
            <SubscribeIconButtonITunes itunesId={pod.itunesId} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function SkeletonTrendingCard() {
  return (
    <>
      <Skeleton variant='rounded' width={'100%'} height={60} />
    </>
  );
}

function TrendingSectionSkeleton() {
  const id = useId();

  return (
    <Grid
      container
      rowSpacing={1}
      columnSpacing={3}
      sx={{
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        gridTemplateColumns: {
          xs: 'repeat(1, minmax(0px, 1fr))',
          sm: 'repeat(2, minmax(0px, 1fr))',
        },
        gridAutoRows: 0,
        overflow: 'hidden',
        rowGap: 0, // add margin bottom to child grid container
      }}
    >
      {Array(8).map((_, i) => (
        <Grid
          size={{ xs: 12, sm: 6 }}
          sx={{ width: 'unset !important', mb: 1 }}
          key={`${id}-${i}`}
        >
          <SkeletonTrendingCard />
        </Grid>
      ))}
    </Grid>
  );
}

function SimilarToLastListened() {
  const { data } = useQuery(convexQuery(api.playback.lastListened, {}));

  if (!data?.podcastId) return null;

  return (
    <>
      <Box>
        {data.podcastTitle ? (
          <Typography
            variant='overline'
            lineHeight={1.2}
            color='textSecondary'
          >{`because you listened to ${data.podcastTitle}`}</Typography>
        ) : null}
        <Typography variant='h6' gutterBottom>
          You might like
        </Typography>
      </Box>

      <SimilarPodcasts podId={data.podcastId} />
    </>
  );
}

// https://open.spotify.com/playlist/37i9dQZF1DWYhD9lyeyCQq?si=9jrGpTpvTAGX8QcIqBknLg
function IndependentPodcastAwardWinners({
  playlistId,
  limit = 16,
}: {
  playlistId: string;
  limit?: number;
}) {
  const theme = useTheme();
  const { data } = useSuspenseQuery({
    queryKey: ['spotify', { playlistId, additional_types: ['episodes'] }],
    queryFn: () =>
      fetchSpotifyPlaylist({
        data: { playlistId, additional_types: ['episodes'] },
      }),
  });

  const items = useMemo(() => data?.tracks?.items.slice(0, limit), [limit]);

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {items?.map((t) => (
        <Grid size={{ xs: 8, sm: 4, md: 4, lg: 2 }} key={t.track.id}>
          <Card
            title={t.track.name}
            subtitle={<Link href={t.track.href}>{`${t.track.name}`}</Link>}
            imgSrc={t.track.images?.[0].url}
            orientation='vertical'
            linkProps={{
              href: t.track.external_urls.spotify,
            }}
            // linkProps={{
            //   to: '/podcasts/$podId/episodes/$episodeId',
            //   params: { podId, episodeId },
            // }}
          >
            <OpenInNewRounded
              htmlColor={
                t.primary_color
                  ? theme.palette.getContrastText(t.primary_color)
                  : undefined
              }
            />
            {/* <SignedIn>
              <PlaybackButton
                episode={{
                  podcastId: podId,
                  feedImage: imgSrc || '',
                  episodeId,
                  title,
                  audioUrl,
                  publishedAt,
                  podcastTitle: podName,
                }}
              />
            </SignedIn> */}
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
// const token = 'BQB0lGd2AfD4lQ-rUefU0qYkvliFJX3_-LJ-fQWqhk8oA7qK72CCxMxECkjB-tNnS-yqNEw0WvmoE0mRxruG-kZKC4XYgMlMhGPfg6d9KILZkHHqsEHwvHXSEDpwDRleoHzuHNS734B0AAksmgSHNc7kXgZ2VCVLZFLJyJzKzm1hPWYU42J6zoMBS0iGnJIwE_8rl_EUVB86tTMlE2kRhyvUY92LLcB75t-FkFvfhI4wqVLA6x7jRUn54KFczT_DKGVV3uQxqa0EVAWxegkWkgpMvkW2pli3FyObHqjjDsz3xrJKcNTycIdtlc2vP9R3Gvec4Nle';
// async function fetchWebApi(endpoint, method, body) {
//   const res = await fetch(`https://api.spotify.com/${endpoint}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     method,
//     body:JSON.stringify(body)
//   });
//   return await res.json();
// }

// async function getTopTracks(){
//   // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
//   return (await fetchWebApi(
//     'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
//   )).items;
// }

// const topTracks = await getTopTracks();
// console.log(
//   topTracks?.map(
//     ({name, artists}) =>
//       `${name} by ${artists.map(artist => artist.name).join(', ')}`
//   )
// );

// // Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
// const token = 'BQB0lGd2AfD4lQ-rUefU0qYkvliFJX3_-LJ-fQWqhk8oA7qK72CCxMxECkjB-tNnS-yqNEw0WvmoE0mRxruG-kZKC4XYgMlMhGPfg6d9KILZkHHqsEHwvHXSEDpwDRleoHzuHNS734B0AAksmgSHNc7kXgZ2VCVLZFLJyJzKzm1hPWYU42J6zoMBS0iGnJIwE_8rl_EUVB86tTMlE2kRhyvUY92LLcB75t-FkFvfhI4wqVLA6x7jRUn54KFczT_DKGVV3uQxqa0EVAWxegkWkgpMvkW2pli3FyObHqjjDsz3xrJKcNTycIdtlc2vP9R3Gvec4Nle';
// async function fetchWebApi(endpoint, method, body) {
//   const res = await fetch(`https://api.spotify.com/${endpoint}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     method,
//     body:JSON.stringify(body)
//   });
//   return await res.json();
// }

// const tracksUri = [
//   'spotify:track:5xMjhZKSo8yh5r9b5vrYRr','spotify:track:7xFM6FkWpeBajNWVQBQFuL','spotify:track:3LtpKP5abr2qqjunvjlX5i','spotify:track:5dPZ04EhmBOdLlyRtPLqEW','spotify:track:2NyrXRn4tancYPW6JwtTl2'
// ];

// async function createPlaylist(tracksUri){
//   const { id: user_id } = await fetchWebApi('v1/me', 'GET')

//   const playlist = await fetchWebApi(
//     `v1/users/${user_id}/playlists`, 'POST', {
//       "name": "My top tracks playlist",
//       "description": "Playlist created by the tutorial on developer.spotify.com",
//       "public": false
//   })

//   await fetchWebApi(
//     `v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
//     'POST'
//   );

//   return playlist;
// }

// const createdPlaylist = await createPlaylist(tracksUri);
// console.log(createdPlaylist.name, createdPlaylist.id);

// const playlistId = '2ZWzsAHeBGni1yx6399vTV';

// <iframe
//   title="Spotify Embed: Recommendation Playlist "
//   src={`https://open.spotify.com/embed/playlist/2ZWzsAHeBGni1yx6399vTV?utm_source=generator&theme=0`}
//   width="100%"
//   height="100%"
//   style={{ minHeight: '360px' }}
//   frameBorder="0"
//   allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
//   loading="lazy"
// />
