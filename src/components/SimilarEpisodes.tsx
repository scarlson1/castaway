import { Grid, type GridProps } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useAction } from 'convex/react';
import { EpisodeCard } from '~/components/EpisodeCard';

export const SimilarEpisodes = ({
  limit = 4,
  episodeConvexId,
  gridItemProps,
}: {
  limit?: number;
  episodeConvexId: Id<'episodes'>;
  gridItemProps?: GridProps;
}) => {
  const getSimilarEpisodes = useAction(
    api.episodeEmbeddings.getSimilarEpisodes
  );

  const { data } = useSuspenseQuery({
    queryKey: ['recs', 'episodes', { limit, episodeConvexId }],
    queryFn: () => getSimilarEpisodes({ limit, episodeConvexId }),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data.map((ep) => (
        <Grid
          size={{ xs: 8, sm: 4, md: 4, lg: 2 }}
          key={ep._id}
          {...gridItemProps}
        >
          <EpisodeCard
            title={ep.title}
            podName={ep.podcastTitle}
            publishedAt={ep.publishedAt}
            podId={ep.podcastId}
            episodeId={ep.episodeId}
            imgSrc={ep.feedImage || ''}
            audioUrl={ep.audioUrl}
          />
        </Grid>
      ))}
    </Grid>
  );
};
