import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import type { Doc } from 'convex/_generated/dataModel';
import { Suspense } from 'react';
import { MuiStackLink } from '~/components/MuiStackLink';
import { PlaybackButton } from '~/components/PlaybackButton';
import { formatRelativeTime, getDuration } from '~/utils/format';

const ClampedTypography = styled(Typography)({
  overflow: 'hidden',
  // display: '-webkit-box',
  // // lineClamp: 2,
  // '-webkit-line-clamp': '2',
  // '-webkit-box-orient': 'vertical',
  // // boxOrient: 'vertical',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

interface TrendingCardProps {
  title: string;
  secondaryText: string;
  publishedAt: number;
  orientation?: 'vertical' | 'horizontal';
  rank?: number;
  podId: string;
  episodeId: string;
  imgSrc: string;
  audioUrl: string;
  duration?: number | null;
  // linkProps?: LinkProps;
}

// TODO: reusable component (not working in vertical orientation)
// currently only used to display episode in DB in row format
export function TrendingCard({
  title,
  secondaryText,
  publishedAt,
  podId,
  episodeId,
  imgSrc,
  orientation = 'horizontal',
  rank,
  audioUrl,
  duration,
}: // linkProps,
TrendingCardProps) {
  let isRow = orientation === 'horizontal';

  return (
    <MuiStackLink
      direction={isRow ? 'row' : 'column'}
      spacing={isRow ? 2 : 0.5}
      to={'/podcasts/$podId/episodes/$episodeId'}
      params={{ podId, episodeId }}
      sx={{
        textDecoration: 'none',
        '&:visited': { color: 'textPrimary' },
        '&:hover': { color: 'textPrimary' },
        minWidth: 0,
        alignItems: 'center',
      }}
      // {...linkProps}
    >
      {rank !== undefined ? (
        <Typography
          variant='overline'
          color='textSecondary'
          sx={{ lineHeight: '1.4', textAlign: 'center' }}
        >
          {rank || ''}
        </Typography>
      ) : null}

      <Box
        sx={{
          width: 52,
          height: 52,
          flex: '0 0 52px',
          objectFit: 'cover',
          aspectRatio: '1/1',
          overflow: 'hidden',
          borderRadius: 1,
          backgroundColor: 'rgba(0,0,0,0.08)',
          '& > img': {
            width: '100%',
          },
        }}
      >
        <img src={imgSrc} alt={`${title} cover art`} />
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 0.25, sm: 2 }}
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          minHeight: 0,
          alignItems: { xs: 'flex-start', sm: 'center' },
          overflow: 'hidden',
          // textOverflow: 'ellipsis',
          // whiteSpace: 'nowrap',
        }}
      >
        <Typography
          variant='body2'
          color='textSecondary'
          sx={{
            display: { xs: 'block', sm: 'none' },
            fontSize: '0.8rem',
            lineHeight: 1.2,
          }}
        >
          {formatRelativeTime(new Date(publishedAt))}
        </Typography>
        <Box sx={{ minWidth: 0, pr: 2, width: '100%' }}>
          <ClampedTypography
            variant='body1'
            color='textPrimary'
            fontWeight={500}
            fontSize={'0.95rem'}
          >
            {title}
          </ClampedTypography>
          <ClampedTypography
            variant='body2'
            color='textSecondary'
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {secondaryText}
          </ClampedTypography>
        </Box>
        <Box
          sx={{
            ml: { xs: 0, sm: 'auto !important' },
            flex: { xs: `0 0 auto`, sm: `0 0 100px` },
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
          }}
        >
          <Typography variant='body2' color='textSecondary'>
            {formatRelativeTime(new Date(publishedAt))}
          </Typography>
        </Box>
        <Box sx={{ flex: { xs: '0 0 auto', sm: '0 0 60px' } }}>
          {duration ? (
            <Typography
              variant='body2'
              color='textSecondary'
              sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}
            >
              {getDuration(duration)}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Suspense
          fallback={
            <Skeleton variant='circular'>
              <IconButton size='small' />
            </Skeleton>
          }
        >
          <PlaybackButton
            episode={
              {
                podcastId: podId,
                episodeId: episodeId,
                feedImage: imgSrc,
                title: title,
                podcastTitle: secondaryText,
                publishedAt,
                audioUrl,
              } as Doc<'episodes'>
            }
            color='primary'
          />
        </Suspense>
      </Box>
    </MuiStackLink>
  );
}
