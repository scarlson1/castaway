import { convexQuery } from '@convex-dev/react-query';
import { Grid } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { EpisodeCard } from '~/components/EpisodeCard';

export const StatsMostPlayedEpisodes = ({
  // podcastId,
  pageSize = 8,
  offset = 0,
}: {
  // podcastId?: string;
  pageSize?: number;
  offset?: number;
}) => {
  const { data } = useSuspenseQuery(
    convexQuery(api.stats.episodes.mostPlayed, {
      // podcastId,
      numItems: pageSize,
      offset,
    })
  );

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {data?.page.map((ep) => (
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
