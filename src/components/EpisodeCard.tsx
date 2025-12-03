import { SignedIn } from '@clerk/tanstack-react-start';
import { PlayArrowRounded } from '@mui/icons-material';
import { Box, IconButton, Stack, styled, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, type MouseEvent, type RefObject } from 'react';
import { useHover } from '~/hooks/useHover';
import { useQueueStore } from '~/hooks/useQueueStore';

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
export function EpisodeCard({
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
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  const playEpisode = useQueueStore((state) => state.setPlaying);

  const handlePlay = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      playEpisode({
        podcastId: podId,
        image: imgSrc || '',
        episodeId: episodeId,
        title,
        audioUrl,
        releaseDateMs: publishedAt,
        podName,
      });
    },
    [episodeId, podId, imgSrc, title, podName, publishedAt, audioUrl]
  );

  const handleClick = useCallback(() => {
    navigate({
      to: '/podcasts/$podId/episodes/$episodeId',
      params: { podId, episodeId },
    });
  }, [navigate, podId, episodeId]);

  return (
    <div ref={ref}>
      <Stack
        direction='column'
        spacing={0.5}
        onClick={() => handleClick()}
        sx={{ '&:hover': { cursor: 'pointer' } }}
      >
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
              <IconButton size='small' onClick={handlePlay}>
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
