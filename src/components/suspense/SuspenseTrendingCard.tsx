import { Box, IconButton, Skeleton, Stack, Typography } from '@mui/material';

export const SuspenseTrendingCard = ({
  orientation,
}: {
  orientation?: string;
}) => {
  const isRow = orientation === 'horizontal';

  return (
    <Stack
      direction={isRow ? 'row' : 'column'}
      spacing={isRow ? 2 : 0.5}
      sx={{ minWidth: 0, alignItems: 'center' }}
    >
      {/* <Skeleton variant="text" sx={{ fontSize: '0.925rem', lineHeight: 1.4 }} /> */}
      <Typography variant='overline' sx={{ lineHeight: '1.4' }}>
        <Skeleton />
      </Typography>
      <Skeleton variant='rounded' width={52} height={52} />
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
        <Typography variant='body1' fontSize={'0.95rem'}>
          <Skeleton />
        </Typography>
        <Typography variant='body2'>
          <Skeleton />
        </Typography>

        <Box
          sx={{
            ml: { xs: 0, sm: 'auto !important' },
            flex: { xs: `0 0 auto`, sm: `0 0 100px` },
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
          }}
        >
          <Typography variant='body2'>
            <Skeleton />
          </Typography>
        </Box>
        {/* <Box sx={{ flex: { xs: '0 0 auto', sm: '0 0 60px' } }}>
          {duration ? (
            <Typography
              variant='body2'
              color='textSecondary'
              sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}
            >
              {getDuration(duration)}
            </Typography>
          ) : null}
        </Box> */}
      </Stack>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Skeleton variant='circular'>
          <IconButton size='small' />
        </Skeleton>
      </Box>
    </Stack>
  );
};
