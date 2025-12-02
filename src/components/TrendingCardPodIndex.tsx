import { AddRounded } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { type LinkProps } from '@tanstack/react-router';
import { useCallback, useRef, type RefObject } from 'react';
import { MuiStackLink } from '~/components/MuiStackLink';
import { useHover } from '~/hooks/useHover';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

// TODO: reuse TrendingCard (issue - subscribed state & link props)
// should support episodes and podcasts

interface TrendingCardProps {
  feed: PodcastFeed; // | TrendingResult
  orientation?: 'vertical' | 'horizontal';
  linkProps?: LinkProps;
}

// use clsx for orientation styling ??
// TODO: fix - pass props individually (title, etc.) so it can be used for trending data and podcast data (podcast index ID vs guid)
export function TrendingCardPodIndex({ feed, linkProps }: TrendingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  const handleSubscribePod = useCallback((e) => {
    e.preventDefault();
    // TODO: useMutation ==> add to user's subscription & invalidate cache
    alert('not implemented yet');
  }, []);

  // TODO: subscribe icon button show subscription status & unfollow if subscribed

  return (
    <div ref={ref}>
      <MuiStackLink
        direction='row'
        spacing={2}
        to={'/podcast/$podId'} // podcast index ID
        params={{ podId: `${feed.id || ''}` }}
        sx={{
          textDecoration: 'none',
          '&:visited': { color: 'textPrimary' },
          '&:hover': { color: 'textPrimary' },
        }}
        {...linkProps}
      >
        <Box
          component='img'
          src={feed.artwork || feed.image}
          sx={{
            height: 60,
            width: 60,
            borderRadius: 1,
            overflow: 'hidden',
            flex: '0 0 60px',
          }}
        />
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant='subtitle1'
            color='textPrimary'
            fontWeight='medium'
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {feed.title}
          </Typography>
          <Typography
            variant='subtitle2'
            component='p'
            color='textSecondary'
            fontWeight={500}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {feed.author}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <IconButton size='small' onClick={handleSubscribePod}>
            <AddRounded fontSize='inherit' />
          </IconButton>
        </Box>
      </MuiStackLink>
    </div>
  );
}
