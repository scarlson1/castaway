import { useConvexAction } from '@convex-dev/react-query';
import { Stack, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';
import { useEffect, useState } from 'react';
import { MuiLink } from '~/components/MuiLink';

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

  if (!recs.length) return null;

  return (
    <>
      {/* <BulkEmbedButton /> */}
      {recs.map((r) => (
        <Stack direction='column' spacing={0} sx={{ my: 1 }} key={r._id}>
          <MuiLink
            to={'/podcasts/$podId/episodes/$episodeId'}
            params={{ podId: r.podcastId, episodeId: r.episodeId }}
            color='textPrimary'
            underline='hover'
          >
            {`${r.title}`}
          </MuiLink>
          <Typography variant='body2' color='textSecondary'>
            {`${r.podcastTitle}`}
          </Typography>
        </Stack>
      ))}
    </>
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
