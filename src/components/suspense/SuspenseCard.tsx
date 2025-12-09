import { Box, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export const SuspenseCard = ({
  orientation,
  rank,
  children,
}: {
  orientation: string;
  rank?: string | boolean;
  children?: ReactNode;
}) => {
  let isRow = orientation === 'horizontal';

  return (
    <Stack
      direction={isRow ? 'row' : 'column'}
      spacing={isRow ? 2 : 0.5}
      sx={{
        position: 'relative',
      }}
    >
      {rank ? (
        <Typography
          variant='overline'
          color='textSecondary'
          sx={{ lineHeight: '1.4', textAlign: 'center' }}
        >
          <Skeleton />
        </Typography>
      ) : null}

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
        <Skeleton />
      </Box>

      {!isRow ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            bottom: 8,
            right: 4,
          }}
        >
          {children}
        </Box>
      ) : null}

      <Stack
        direction='column'
        spacing={0.25}
        sx={{
          justifyContent: isRow ? 'center' : 'flex-start',
          flex: '1 1 auto',
        }}
      >
        <Typography variant='body1' fontWeight='medium'>
          <Skeleton />
        </Typography>
        <Typography variant='body2' color='textSecondary' fontWeight={500}>
          <Skeleton />
        </Typography>
      </Stack>

      {isRow && Boolean(children) ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {children}
        </Box>
      ) : null}
    </Stack>
  );
};
