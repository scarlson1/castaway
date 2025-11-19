import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export const Route = createFileRoute('/trending')({
  component: RouteComponent,
  // validateSearch: zodValidator(trendingSearchOptions),
});

function RouteComponent() {
  // TODO: reuse card on discover page ?? pass prop for orientation --> flexDirection: 'column-reverse' or 'row' ??

  return (
    <>
      {/* <Typography variant='h4' gutterBottom>
          Trending
        </Typography> */}

      {/* <MuiButtonLink to='/trending'>Podcast Index</MuiButtonLink> */}
      {/* <MuiButtonLink to='/trending/apple'>Apple Charts</MuiButtonLink> */}
      <ErrorBoundary fallback={<div>An error occurred</div>}>
        <Suspense>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
