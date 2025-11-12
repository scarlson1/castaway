import { Stack, Typography } from '@mui/material';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import z from 'zod';
import { MuiButtonLink } from '~/components/MuiButtonLink';

export const trendingSearchOptions = z.object({
  limit: z.number().optional().default(100),
});

export const Route = createFileRoute('/trending')({
  component: RouteComponent,
  validateSearch: zodValidator(trendingSearchOptions),
  // loader: ({ context, params }) => {
  //   // Access the queryClient from the context
  //   context.queryClient.prefetchQuery(trendingQueryOptions(params));
  // },
});

function RouteComponent() {
  // TODO: reuse card on discover page ?? pass prop for orientation --> flexDirection: 'column-reverse' or 'row' ??

  return (
    <>
      <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
        <Typography variant='h4' gutterBottom>
          Trending
        </Typography>
        {/* <FormControl sx={{ width: 180, ml: 'auto' }}>
          <InputLabel id='demo-simple-select-label'>Trending</InputLabel>
          <Select value={weeks} onChange={handleSinceChange} label='Trending'>
            <MenuItem value={1}>last week</MenuItem>
            <MenuItem value={4}>last month</MenuItem>
            <MenuItem value={52}>last year</MenuItem>
          </Select>
        </FormControl> */}
      </Stack>
      <MuiButtonLink to='/trending'>Podcast Index</MuiButtonLink>
      <MuiButtonLink to='/trending/apple'>Apple Charts</MuiButtonLink>
      <ErrorBoundary fallback={<div>An error occurred</div>}>
        <Suspense>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
