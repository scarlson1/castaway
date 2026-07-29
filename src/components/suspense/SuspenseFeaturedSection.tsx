import { Box, Skeleton, Typography } from '@mui/material';

export const SuspenseFeaturedSection = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        sx={{
          objectFit: 'cover',
          aspectRatio: '1/1',
          overflow: 'hidden',
          // flexGrow: 0,
          // flexShrink: 0,
          // flexBasis: { xs: '80px', sm: '100px', md: '140px', lg: '180px' },
          flex: {
            xs: '0 0 100px',
            sm: '0 0 160px',
            md: '0 0 200px',
            lg: '0 0 240px',
          },
          width: { xs: 100, sm: 160, md: 200, lg: 240 },
          height: 'auto',
          borderRadius: 1, // { xs: 1, md: 2 },
          '& > img': { width: '100%', borderRadius: 'inherit' },
        }}
      >
        <Skeleton variant='rounded' />
      </Box>
      <Box sx={{ ml: 2, flex: '1 1 auto' }}>
        <Typography
          variant='overline'
          color='primary'
          component='div'
          sx={{ fontWeight: 'medium' }}
        >
          <Skeleton />
        </Typography>
        <Typography variant='h5' sx={{ fontWeight: 500 }} gutterBottom>
          <Skeleton />
        </Typography>

        <Typography variant='subtitle1' sx={{ fontWeight: 500 }} gutterBottom>
          <Skeleton />
        </Typography>

        <Typography color='textSecondary' variant='body2'>
          <Skeleton />
        </Typography>
        <Typography color='textSecondary' variant='body2'>
          <Skeleton />
        </Typography>
        <Typography color='textSecondary' variant='body2'>
          <Skeleton />
        </Typography>
      </Box>
    </Box>
  );
};
