import { useConvexAction } from '@convex-dev/react-query';
import { CircularProgress, Grid } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { useEffect, useState } from 'react';
import { EpisodeCard } from '~/components/EpisodeCard';

export const RecommendedEpisodes = ({ limit = 8 }: { limit?: number }) => {
  // const { data } = useSuspenseQuery({
  //   queryKey: ['recommendations'],
  //   queryFn: () => test({ limit: 8 }),
  // });
  const [recs, setRecs] = useState<Doc<'episodes'>[]>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: useConvexAction(
      api.episodeEmbeddings.getPersonalizedRecommendations
    ),
    // onMutate: () => toast.loading(`checking for new episodes`),
    onSuccess: (result) => {
      console.log('RECS: ', result);
      setRecs(result as Doc<'episodes'>[]);
    },
    onError: (err) => console.log(err),
  });

  useEffect(() => {
    mutate({ limit });
  }, [mutate]);

  if (isPending && !recs.length) return <CircularProgress />;

  if (!recs.length) return null;

  return (
    <Grid container columnSpacing={2} rowSpacing={1} columns={16}>
      {recs.map((ep) => (
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

// function BulkEmbedButton() {
//   const { mutate, isPending } = useMutation({
//     mutationFn: useConvexAction(api.episodeEmbeddings.bulkEmbedEpisodes),
//     // onMutate: () => toast.loading(`checking for new episodes`),
//     onSuccess: (result) => {
//       console.log('EMB RESULT: ', result);
//     },
//     onError: (err) => console.log(err),
//   });

//   return (
//     <Button
//       onClick={() =>
//         mutate({
//           podcastId: '6007cced-b61d-5005-b01b-6c4e7b5f1987',
//           batchSize: 2,
//         })
//       }
//       loading={isPending}
//     >
//       Bulk Embed
//     </Button>
//   );
// }
