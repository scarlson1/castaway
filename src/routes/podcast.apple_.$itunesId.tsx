import { Box } from '@mui/material';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { EpisodesList, PodDetails } from '~/routes/podcast.$podId';
import { trendingSearchOptions } from '~/routes/trending';
import { fetPodDetailsByITunes } from '~/serverFn/podcast';

export const podDetailsITunesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['podcast', id],
    queryFn: () => fetPodDetailsByITunes({ data: { id } }),
    staleTime: Infinity, // Or a suitable value for your use case
  });

export const Route = createFileRoute('/podcast/apple_/$itunesId')({
  component: RouteComponent,
  validateSearch: zodValidator(trendingSearchOptions),
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(
      podDetailsITunesQueryOptions(parseInt(params.itunesId))
    );
  },
});

function RouteComponent() {
  const { itunesId } = Route.useParams();
  const { limit } = Route.useSearch();
  const { data } = useSuspenseQuery(
    podDetailsITunesQueryOptions(parseInt(itunesId))
  );

  if (!data.feed) throw new Error(`Error finding podcast with ID ${itunesId}`);

  return (
    <>
      <PodDetails feed={data.feed} />

      <Box sx={{ py: 4 }}>
        {/* TODO: add error boundary */}
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <Suspense>
            <EpisodesList
              podId={data.feed.podcastGuid}
              podTitle={data.feed.title}
              limit={limit}
            />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </>
  );
}
