import {
  Box,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

const SuspenseEpisodeRow = () => {
  return (
    <Stack
      direction='row'
      sx={{ alignItems: 'center', my: { xs: 0.5, sm: 1 } }}
    >
      <Typography variant='body1' width={80}>
        <Skeleton />
      </Typography>
      <Typography variant='body1' sx={{ flex: '1 1 60%' }}>
        <Skeleton />
      </Typography>
      <Typography variant='body2' sx={{ width: 100 }}>
        <Skeleton />
      </Typography>
      <Typography variant='body2' sx={{ width: 80 }}>
        <Skeleton />
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pl: 2,
        }}
      >
        <Skeleton variant='circular'>
          <IconButton size='small' />
        </Skeleton>
      </Box>
    </Stack>
  );
};

export const SuspenseEpisodeList = ({ numItems }: { numItems: number }) => {
  let arr = Array.from({ length: numItems }, (v, i) => i + 1);
  return (
    <>
      {/* <TextField placeholder='search episodes' label='TODO: episode search' /> */}
      {arr.map((e) => (
        <Box key={`ep-list-skeleton-${e}`}>
          <SuspenseEpisodeRow />
          <Divider />
        </Box>
      ))}
    </>
  );
};
