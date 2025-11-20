import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

// TODO: fetch apple top charts once a day --> save to DB

export const trendingSearchOptions = z.object({
  limit: z.number().optional().default(100),
});

export const Route = createFileRoute('/trending/apple')({
  component: TopApple,
  // validateSearch: zodValidator(trendingSearchOptions),
  // Define which search params your loader depends on
  // loaderDeps: ({ search: { limit } }) => ({ limit }),
  // loader: ({ context: { queryClient }, deps }) => {
  //   queryClient.prefetchQuery(appleChartsQueryOptions({ limit: deps.limit }));
  // },
});

function TopApple() {
  return <div>TODO: delete route</div>;
}

// function TopApple() {
//   const { limit } = Route.useSearch();
//   const { data } = useSuspenseQuery(appleChartsQueryOptions({ limit }));

//   return (
//     <Grid
//       container
//       columnSpacing={{ xs: 2, sm: 1.5, md: 2 }}
//       rowSpacing={{ xs: 2, sm: 3, md: 4 }}
//     >
//       {data.feed.results.map((f, i) => (
//         <Grid key={f.id} size={{ xs: 6, sm: 3, md: 2 }}>
//           <TrendingCard
//             feed={
//               {
//                 id: '',
//                 artwork: f.artworkUrl100,
//                 title: f.name,
//                 author: f.artistName,
//               } as unknown as PodcastFeed
//             }
//             orientation='vertical'
//             rank={i + 1}
//             linkProps={{
//               to: '/podcast/apple/$itunesId',
//               params: { itunesId: `${f.id || ''}` },
//             }}
//           />
//         </Grid>
//       ))}
//     </Grid>
//   );
// }
