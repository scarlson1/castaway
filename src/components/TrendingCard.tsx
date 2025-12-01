import { Box, Stack, styled, Typography } from '@mui/material';
import type { Doc } from 'convex/_generated/dataModel';
import { Suspense } from 'react';
import { MuiStackLink } from '~/components/MuiStackLink';
import { PlaybackButton } from '~/components/PlaybackButton';
import { formatRelativeTime } from '~/utils/format';

const ClampedTypography = styled(Typography)({
  overflow: 'hidden',
  display: '-webkit-box',
  // lineClamp: 2,
  '-webkit-line-clamp': '2',
  '-webkit-box-orient': 'vertical',
  // boxOrient: 'vertical',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

interface TrendingCardProps {
  title: string;
  secondaryText: string;
  // actionText?: string;
  publishedAt: number;
  orientation?: 'vertical' | 'horizontal';
  rank?: number;
  podId: string;
  episodeId: string;
  imgSrc: string;
  audioUrl: string;
  // linkProps?: LinkProps;
}

// TODO: reusable component
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

      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            objectFit: 'cover',
            overflow: 'hidden',
            flex: '0 0 52px',
            borderRadius: 1,
            backgroundColor: 'rgba(0,0,0,0.08)',
            '& > img': {
              width: '100%',
            },
          }}
        >
          <img src={imgSrc} alt={`${title} cover art`} />
        </Box>
      </Box>

      <Stack direction='column' spacing={0.5} sx={{ minWidth: 0, pr: 2 }}>
        <ClampedTypography variant='body1' color='textPrimary'>
          {title}
        </ClampedTypography>
        <ClampedTypography variant='body2' color='textSecondary'>
          {secondaryText}
        </ClampedTypography>
      </Stack>
      <Box
        sx={{
          ml: 'auto !important',
          flex: `0 0 100px`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant='body2' color='textSecondary'>
          {formatRelativeTime(new Date(publishedAt))}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Suspense>
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
          />
        </Suspense>
      </Box>
    </MuiStackLink>
  );
}
