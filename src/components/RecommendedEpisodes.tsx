import { Grid } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useAction } from 'convex/react';
import { EpisodeCard } from '~/components/EpisodeCard';

export const RecommendedEpisodes = ({ limit = 8 }: { limit?: number }) => {
  const getPersonalizedRecommendations = useAction(
    api.episodeEmbeddings.getPersonalizedRecommendations
  );
  const { data } = useSuspenseQuery({
    queryKey: ['recs', 'episodes', { limit }],
    queryFn: () => getPersonalizedRecommendations({ limit: 8 }),
  });

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data.map((ep) => (
        <Grid size={{ xs: 8, sm: 4, md: 4, lg: 2 }} key={ep._id}>
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
