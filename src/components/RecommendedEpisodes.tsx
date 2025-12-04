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
  // const [recs, setRecs] = useState<Doc<'episodes'>[]>([]);

  // const { mutate, isPending } = useMutation({
  //   mutationFn: useConvexAction(
  //     api.episodeEmbeddings.getPersonalizedRecommendations
  //   ),
  //   // onMutate: () => toast.loading(`checking for new episodes`),
  //   onSuccess: (result) => {
  //     console.log('RECS: ', result);
  //     setRecs(result as Doc<'episodes'>[]);
  //   },
  //   onError: (err) => console.log(err),
  // });

  // useEffect(() => {
  //   mutate({ limit });
  // }, [mutate]);

  // if (isPending && !recs.length) return <CircularProgress />;

  // if (!recs.length) return null;

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
