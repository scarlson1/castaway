import { Box, Skeleton, Stack } from '@mui/material';

export function SuspensePodDetails() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '96px 1fr', sm: '200px 1fr' },
        gap: { xs: 2, sm: 3.5 },
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.75,
        mb: 3,
      }}
    >
      <Skeleton
        variant='rounded'
        sx={{ width: { xs: 96, sm: 200 }, height: { xs: 96, sm: 200 } }}
      />
      <Box>
        <Skeleton width={60} height={12} sx={{ mb: 1 }} />
        <Skeleton
          variant='text'
          sx={{ fontSize: '2rem', width: '60%', mb: 1 }}
        />
        <Skeleton width={120} height={16} sx={{ mb: 1 }} />
        <Stack direction='row' spacing={2} sx={{ mt: 1 }}>
          <Skeleton width={100} height={14} />
          <Skeleton width={80} height={14} />
        </Stack>
        <Box sx={{ mt: 1.5 }}>
          <Skeleton />
          <Skeleton />
          <Skeleton width='60%' />
        </Box>
      </Box>
    </Box>
  );
}
