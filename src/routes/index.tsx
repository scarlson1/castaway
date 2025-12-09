import { SignedIn } from '@clerk/tanstack-react-start';
import { convexQuery, useConvexAuth } from '@convex-dev/react-query';
import { Box, Divider, Grid, Stack, styled, Typography } from '@mui/material';
import { ErrorBoundary } from '@sentry/tanstackstart-react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Suspense } from 'react';
import { Authed } from '~/components/Authed';
import { CategoryCard } from '~/components/CategoryCard';
import { EpisodeCard } from '~/components/EpisodeCard';
import { Featured } from '~/components/Featured';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { MuiLink } from '~/components/MuiLink';
import { RecommendedEpisodes } from '~/components/RecommendedEpisodes';
import { RecommendedPods } from '~/components/RecommendedPods';
import { SuspenseGridCards } from '~/components/suspense/SuspenseGridCards';
import {
  categoryQueryOptions,
  randomEpisodesQueryOptions,
  recentEpisodesQueryOptions,
} from '~/queries';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const { isAuthenticated } = useConvexAuth();
  return (
    <Stack direction='column' spacing={{ xs: 4, sm: 5, md: 6 }}>
      {/* <Typography variant='h1' marginBlockEnd={4}>
        Castaway
      </Typography> */}
      <Featured />

      <Divider flexItem />

      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
            width: '100%',
          }}
        >
          <Typography variant='h5'>Episodes you won't want to miss</Typography>
          <SignedIn>
            <MuiButtonLink to='/podcasts/feed'>See more</MuiButtonLink>
          </SignedIn>
        </Box>
        <RecentSubscribedEpisodes />
      </Box>

      <Divider flexItem />

      <Box>
        <Typography variant='h5' gutterBottom>
          New Episode Releases
        </Typography>
        <RecentEpisodes />
      </Box>

      <Divider flexItem />

      {isAuthenticated ? (
        <Box sx={{ width: '100%' }}>
          <Box>
            <Typography
              variant='overline'
              lineHeight={1.2}
              color='textSecondary'
            >
              Based on your listening
            </Typography>
            <Typography variant='h5' gutterBottom>
              Podcasts you might like
            </Typography>
          </Box>
          <ErrorBoundary fallback={<div>Error loading recommendations</div>}>
            <Suspense
              fallback={
                <SuspenseGridCards
                  numItems={8}
                  columnSpacing={2}
                  rowSpacing={1}
                  columns={16}
                  childGridProps={{
                    size: { xs: 8, sm: 4, md: 4, lg: 2 },
                  }}
                />
              }
            >
              <RecommendedPods limit={8} />
            </Suspense>
          </ErrorBoundary>
        </Box>
      ) : null}

      <Divider flexItem />

      <Authed>
        <Box sx={{ width: '100%' }}>
          <Box>
            <Typography
              variant='overline'
              lineHeight={1.2}
              color='textSecondary'
            >
              Based on your listening
            </Typography>
            <Typography variant='h5' gutterBottom>
              Episodes you might like
            </Typography>
          </Box>

          <ErrorBoundary fallback={<div>Error loading recommendations</div>}>
            <RecommendedEpisodes limit={8} />
          </ErrorBoundary>
        </Box>
      </Authed>

      <Divider flexItem />

      <Box>
        <Typography variant='h5' gutterBottom>
          Find something new
        </Typography>
        <RandomEpisodes />
      </Box>

      {/* TODO: get most recent listened episode and use to generate recommendations */}

      <Divider flexItem />

      <Box sx={{ width: '100%' }}>
        <Typography variant='h5' gutterBottom>
          Categories
        </Typography>
        <PodcastGenreCards />
      </Box>

      {/* <TestGraphQL /> */}
    </Stack>
  );
}

// function TestGraphQL() {
//   const { data } = useQuery({
//     queryKey: ['test', 'graphql'],
//     queryFn: () => podchaserPodcasts({ data: { first: 2 } }),
//     staleTime: 1000 * 60 * 10,
//   });

//   console.log(data);

//   return null;
// }

function RecentSubscribedEpisodes() {
  const { data } = useQuery(
    convexQuery(api.episodes.unauthedRecentEpisodes, { limit: 8 })
  );

  // TODO: change UI to larger image cards with single row scroll
  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data?.map((ep) => (
        <Grid size={{ xs: 8, sm: 4, md: 4, lg: 2 }} key={ep._id}>
          <EpisodeCard
            title={ep.title}
            podName={ep.podcastTitle}
            imgSrc={ep.feedImage || ''}
            podId={ep.podcastId}
            episodeId={ep.episodeId}
            audioUrl={ep.audioUrl}
            publishedAt={ep.publishedAt}
          />
        </Grid>
      ))}
    </Grid>
  );
}

const colors = [
  'success.light',
  'error.light',
  'warning.light',
  'info.light',
  'secondary.light',
  'primary.light',
];

function getRandomColor(i: number) {
  // const randomIndex = Math.floor(Math.random() * colors.length);
  const index = i < 5 ? i : i % 6;
  return colors[index];
}

function PodcastGenreCards() {
  const { data } = useQuery(categoryQueryOptions());

  let slicedData = data?.slice(0, 40);

  return (
    <Grid container spacing={3}>
      {slicedData?.map((d, i) => (
        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={d.id}>
          <CategoryCard
            title={d.name}
            category={d.name}
            color={getRandomColor(i)}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function RandomEpisodes() {
  const { data } = useQuery(randomEpisodesQueryOptions({ max: 8, lang: 'en' }));

  return (
    <Grid container columnSpacing={2} rowSpacing={1}>
      {data?.map((ep) => (
        <Grid size={{ xs: 12, sm: 6 }} key={ep.id}>
          <EpisodeItem
            title={ep.title}
            subtitle={ep.feedTitle}
            imgSrc={ep.feedImage}
            podId={ep.feedId}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function RecentEpisodes() {
  const { data } = useQuery(recentEpisodesQueryOptions({ max: 8 }));

  return (
    <Grid container columnSpacing={2} rowSpacing={1}>
      {data?.map((ep) => (
        <Grid size={{ xs: 12, sm: 6 }} key={ep.id}>
          <EpisodeItem
            title={ep.title}
            subtitle={ep.feedTitle}
            imgSrc={ep.feedImage}
            podId={ep.feedId}
          />
        </Grid>
      ))}
    </Grid>
  );
}

const CoverImage = styled('div')(({ theme }) => ({
  width: 52,
  height: 52,
  // flex: '0 0 60px',
  [theme.breakpoints.up('sm')]: {
    width: 64,
    height: 64,
  },

  objectFit: 'cover',
  overflow: 'hidden',
  flexShrink: 0,
  borderRadius: 8,
  backgroundColor: 'rgba(0,0,0,0.08)',
  '& > img': {
    width: '100%',
  },
}));

function EpisodeItem({
  title,
  subtitle,
  imgSrc,
  podId,
}: {
  title: string;
  subtitle: string;
  imgSrc: string;
  podId: number;
}) {
  return (
    <Stack direction='row' spacing={2}>
      <CoverImage>
        <img src={imgSrc} alt={title} />
      </CoverImage>
      <Box
        sx={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
        <MuiLink
          to='/podcast/$podId'
          params={{ podId: `${podId}` }}
          underline='none'
          variant='subtitle1'
          color='textPrimary'
          fontWeight='medium'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </MuiLink>
        <MuiLink
          to='/podcast/$podId'
          params={{ podId: `${podId}` }}
          variant='subtitle2'
          color='textSecondary'
          underline='none'
          fontWeight={500}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </MuiLink>
      </Box>
    </Stack>
  );
}
