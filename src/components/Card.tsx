import { Box, Stack, styled, Typography } from '@mui/material';
import { Link, type LinkProps } from '@tanstack/react-router';
import { useRef, type ReactNode, type RefObject } from 'react';
import { MuiLink } from '~/components/MuiLink';
import { useHover } from '~/hooks/useHover';

const ClampedTypography = styled(Typography<'div'>)({
  overflow: 'hidden',
  display: '-webkit-box',
  // lineClamp: 2,
  '-webkit-line-clamp': '2',
  '-webkit-box-orient': 'vertical',
  // boxOrient: 'vertical',
  textOverflow: 'ellipsis',
  '& a': { color: 'inherit', textDecoration: 'none' },
  '& a:visited': { color: 'inherit' },
});

interface CardProps {
  // feed: PodcastFeed | TrendingFeed;
  orientation?: 'vertical' | 'horizontal';
  rank?: number;
  imgSrc: string;
  title: string | ReactNode;
  subtitle: string | ReactNode;
  children?: ReactNode;
  linkProps?: LinkProps;
}

export function Card({
  orientation,
  imgSrc,
  rank,
  title,
  subtitle,
  children,
  linkProps,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering] = useHover<HTMLDivElement>(
    ref as RefObject<HTMLDivElement>
  );

  let isRow = orientation === 'horizontal';

  return (
    <div ref={ref}>
      <Stack
        direction={isRow ? 'row' : 'column'}
        spacing={isRow ? 2 : 0.5}
        sx={{
          position: 'relative',
        }}
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
          <Link {...linkProps}>
            <Box
              sx={{
                width: isRow ? 60 : '100%',
                height: isRow ? 60 : 'auto',
                overflow: 'hidden',
                borderRadius: 1,
                objectFit: 'cover',
                aspectRatio: '1/1',
                backgroundColor: 'rgba(0,0,0,0.08)',
                '& > img': { width: '100%' },
              }}
            >
              <img src={imgSrc} alt={`${title}`} />
            </Box>
          </Link>

          {/* render over image (TODO: render in middle if orientation = row ?? ) */}
          {!isRow ? (
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
              {children}
            </Box>
          ) : null}
        </Box>

        <Stack
          direction='column'
          spacing={0.25}
          sx={{
            justifyContent: isRow ? 'center' : 'flex-start',
            flex: '1 1 auto',
          }}
        >
          <ClampedTypography
            variant='body1'
            color='textPrimary'
            fontWeight='medium'
            sx={{ '-webkit-line-clamp': isRow ? '1' : '2' }}
            component='div'
          >
            {linkProps ? (
              <MuiLink {...linkProps} underline='none'>
                {title}
              </MuiLink>
            ) : (
              title
            )}
          </ClampedTypography>
          <ClampedTypography
            variant='body2'
            color='textSecondary'
            fontWeight={500}
            sx={{ '-webkit-line-clamp': isRow ? '1' : '2' }}
            component='div'
          >
            {subtitle}
          </ClampedTypography>
        </Stack>

        {isRow && Boolean(children) ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              opacity: isHovering ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            {children}
          </Box>
        ) : null}
      </Stack>
    </div>
  );
}
