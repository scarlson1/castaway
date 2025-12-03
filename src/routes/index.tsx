import { SignedIn } from '@clerk/tanstack-react-start';
import { convexQuery, useConvexAuth } from '@convex-dev/react-query';
import { PlayArrowRounded } from '@mui/icons-material';
import {
  Box,
  Divider,
  Grid,
  IconButton,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { ErrorBoundary } from '@sentry/tanstackstart-react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useCallback, useRef, type RefObject } from 'react';
import { CategoryCard } from '~/components/CategoryCard';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { MuiLink } from '~/components/MuiLink';
import { RecommendedEpisodes } from '~/components/RecommendedEpisodes';
import { useHover } from '~/hooks/useHover';
import { useQueueStore } from '~/hooks/useQueueStore';
import {
  categoryQueryOptions,
  randomEpisodesQueryOptions,
  recentEpisodesQueryOptions,
} from '~/queries';
import { podchaserPodcasts } from '~/serverFn/podchaser';

// spotify inspo: https://open.spotify.com/genre/0JQ5DArNBzkmxXHCqFLx2J

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const { isAuthenticated } = useConvexAuth();
  return (
    <Stack alignItems='center' spacing={{ xs: 4, sm: 5, md: 6 }}>
      {/* <Typography variant='h1' marginBlockEnd={4}>
        Castaway
      </Typography> */}
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

      <Box>
        <Typography variant='h5' gutterBottom>
          Find something new
        </Typography>
        <RandomEpisodes />
      </Box>

      <Divider flexItem />

      {isAuthenticated ? (
        <Box sx={{ width: '100%' }}>
          <Typography variant='h5' gutterBottom>
            You might also like
          </Typography>
          <ErrorBoundary fallback={<div>Error loading recommendations</div>}>
            <RecommendedEpisodes limit={8} />
          </ErrorBoundary>
        </Box>
      ) : null}

      {/* TODO: get most recent listened episode and use to generate recommendations */}

      <Divider flexItem />

      <Box sx={{ width: '100%' }}>
        <Typography variant='h5' gutterBottom>
          Categories
        </Typography>
        <PodcastGenreCards />
      </Box>

      <TestGraphQL />
    </Stack>
  );
}

function TestGraphQL() {
  const { data } = useQuery({
    queryKey: ['test', 'graphql'],
    queryFn: () => podchaserPodcasts({ data: { first: 2 } }),
    staleTime: 1000 * 60 * 10,
  });

  console.log(data);

  return null;
}

function RecentSubscribedEpisodes() {
  const { data } = useQuery(
    convexQuery(api.episodes.unauthedRecentEpisodes, { limit: 8 })
  );

  // TODO: change UI to larger image cards with single row scroll
  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data?.map((ep) => (
        <Grid size={{ xs: 8, sm: 4, md: 4, lg: 2 }} key={ep._id}>
          <EpisodeVerticalCard
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

const ClampedTypography = styled(Typography)({
  overflow: 'hidden',
  display: '-webkit-box',
  // lineClamp: 2,
  '-webkit-line-clamp': '2',
  '-webkit-box-orient': 'vertical',
  // boxOrient: 'vertical',
  textOverflow: 'ellipsis',
});

// TODO: generalize card in trending.tsx / components/TrendingCard
function EpisodeVerticalCard({
  imgSrc,
  title,
  podName,
  episodeId,
  podId,
  audioUrl,
  publishedAt,
}: {
  imgSrc: string;
  title: string;
  podName: string;
  episodeId: string;
  podId: string;
  audioUrl: string;
  publishedAt: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  const playEpisode = useQueueStore((state) => state.setPlaying);

  const handlePlay = useCallback(() => {
    playEpisode({
      podcastId: podId,
      image: imgSrc || '',
      episodeId: episodeId,
      title,
      audioUrl,
      releaseDateMs: publishedAt,
      podName,
    });
  }, [episodeId, podId, imgSrc, title, podName, publishedAt, audioUrl]);

  return (
    <div ref={ref}>
      <Stack direction='column' spacing={0.5}>
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: '100%', // { xs: 52, sm: 64 },
              // height: 'auto',
              height: { xs: 120, sm: 180, md: 128 },
              // flex: '0 0 60px',
              objectFit: 'cover',
              overflow: 'hidden',
              flexShrink: 0,
              borderRadius: 1,
              backgroundColor: 'rgba(0,0,0,0.08)',
              '& > img': {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              },
            }}
          >
            <img src={imgSrc} alt={podName} />
          </Box>
          <SignedIn>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                position: 'absolute',
                bottom: 8,
                right: 4,
              }}
            >
              <IconButton size='small' onClick={() => handlePlay()}>
                <PlayArrowRounded fontSize='inherit' />
              </IconButton>
              {/* <SubscribeIconButton
              podcastId={(feed as PodcastFeed).podcastGuid}
            /> */}
            </Box>
          </SignedIn>
        </Box>
        <ClampedTypography variant='body1' color='textPrimary'>
          {title}
        </ClampedTypography>
        <ClampedTypography variant='body2' color='textSecondary'>
          {podName}
        </ClampedTypography>
      </Stack>
    </div>
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

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

function PodcastGenreCards() {
  const { data } = useQuery(categoryQueryOptions());

  let slicedData = data?.slice(0, 36);

  return (
    <Grid container spacing={3}>
      {slicedData?.map((d) => (
        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={d.id}>
          <CategoryCard
            title={d.name}
            category={d.name}
            color={getRandomColor()}
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
