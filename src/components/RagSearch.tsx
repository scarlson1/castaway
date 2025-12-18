import { useConvexAction } from '@convex-dev/react-query';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMemo } from 'react';
import { MuiLink } from '~/components/MuiLink';
import { PlaybackButton } from '~/components/PlaybackButton';
import { formatTimestamp, getDuration } from '~/utils/format';

// export const RagSearch = ({ podcastId }: { podcastId?: string }) => {
//   const [query, setQuery] = useState('');
//   const debouncedQuery = useDebounce(query, 500);

//   const queryOptions = useMemo(
//     () => ({
//       query: debouncedQuery,
//       filters: podcastId
//         ? ([{ name: 'podcastId', value: podcastId }] as {
//             name: 'object' | 'podcastId' | 'category';
//             value: string;
//           }[])
//         : undefined,
//       globalNamespace: true,
//       limit: 5,
//     }),
//     [podcastId, debouncedQuery]
//   );

//   const search = useConvexAction(api.rag.search);

//   const { data, isError, error } = useQuery({
//     queryKey: ['search', 'rag', queryOptions],
//     queryFn: () => search(queryOptions),
//     enabled: Boolean(debouncedQuery.trim()),
//   });

//   return (
//     <Box sx={{ py: 3 }}>
//       <TextField
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//         fullWidth
//         placeholder='search episodes'
//       />
//       {isError ? (
//         <Typography color='error'>
//           {error?.message || 'an error occurred'}
//         </Typography>
//       ) : null}

//       {data?.entries?.length ? (
//         <Stack
//           direction='column'
//           spacing={1}
//           divider={<Divider flexItem />}
//           sx={{ my: 2 }}
//         >
//           {data?.entries?.map((hit) => (
//             <TempEpisodeRow
//               podcastId={hit.metadata?.podcastId || podcastId || ''}
//               episodeId={hit.metadata?.episodeId || ''}
//               title={hit.title || ''}
//               podcastTitle={hit.metadata?.podcastTitle || ''}
//               publishedAt={hit.metadata?.publishedAt || 0}
//               durationSeconds={hit.metadata?.durationSeconds || 0}
//               audioUrl={hit.metadata?.audioUrl || ''}
//               image={hit.metadata?.image || ''}
//               key={hit.entryId}
//             />
//           ))}
//         </Stack>
//       ) : null}

//       <Typography component='div' variant='body2'>
//         <pre>{JSON.stringify(data, null, 2)}</pre>
//       </Typography>
//     </Box>
//   );
// };

export function RagEpisodeResults({
  podcastId,
  query,
}: {
  podcastId?: string;
  query: string;
}) {
  const queryOptions = useMemo(
    () => ({
      query,
      filters: podcastId
        ? ([{ name: 'podcastId', value: podcastId }] as {
            name: 'object' | 'podcastId' | 'category';
            value: string;
          }[])
        : undefined,
      globalNamespace: true,
      limit: 5,
    }),
    [podcastId, query]
  );

  const search = useConvexAction(api.rag.search);

  const { data, isError, error } = useQuery({
    queryKey: ['search', 'rag', queryOptions],
    queryFn: () => search(queryOptions),
    enabled: Boolean(query.trim()),
  });

  return (
    <Box>
      {isError ? (
        <Typography color='error'>
          {error?.message || 'an error occurred'}
        </Typography>
      ) : null}

      {data?.entries?.length ? (
        <Stack
          direction='column'
          spacing={1}
          divider={<Divider flexItem />}
          sx={{ my: 2 }}
        >
          {data?.entries?.map((hit) => (
            <TempEpisodeRow
              podcastId={hit.metadata?.podcastId || podcastId || ''}
              episodeId={hit.metadata?.episodeId || ''}
              title={hit.title || ''}
              podcastTitle={hit.metadata?.podcastTitle || ''}
              publishedAt={hit.metadata?.publishedAt || 0}
              durationSeconds={hit.metadata?.durationSeconds || 0}
              audioUrl={hit.metadata?.audioUrl || ''}
              image={hit.metadata?.image || ''}
              key={hit.entryId}
            />
          ))}
        </Stack>
      ) : (
        <Typography textAlign='center' sx={{ py: 3 }}>
          No results found
        </Typography>
      )}

      {/* <Typography component='div' variant='body2'>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Typography> */}
    </Box>
  );
}

function TempEpisodeRow({
  episodeNum,
  podcastId,
  title,
  podcastTitle,
  episodeId,
  publishedAt,
  durationSeconds,
  audioUrl,
  image,
}: {
  episodeNum?: string | number;
  podcastId: string;
  episodeId: string;
  title: string;
  podcastTitle: string;
  publishedAt: number;
  durationSeconds: number;
  audioUrl: string;
  image: string;
}) {
  return (
    <Stack
      direction='row'
      sx={{ alignItems: 'center', my: { xs: 0.5, sm: 1 } }}
      spacing={2}
    >
      <Typography
        color='textSecondary'
        sx={{ width: 80, flex: '0 0 80px', overflow: 'hidden' }}
      >
        {episodeNum ? `E${episodeNum}` : ''}
      </Typography>
      <MuiLink
        to='/podcasts/$podId/episodes/$episodeId'
        params={{ podId: podcastId, episodeId: episodeId }}
        underline='hover'
        sx={{ flex: '1 1 auto', color: 'inherit', minWidth: 0 }}
      >
        <Typography
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: '1 1 60%',
          }}
        >
          {title}
        </Typography>
      </MuiLink>
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{
          width: 80,
          flex: '0 0 80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {formatTimestamp(publishedAt)}
      </Typography>
      <Typography
        variant='body2'
        color='textSecondary'
        sx={{ width: 80, flex: '0 0 80px' }}
      >
        {durationSeconds ? getDuration(durationSeconds) : ''}
      </Typography>
      <Box sx={{ flex: '0 0 60px' }}>
        {audioUrl ? (
          <PlaybackButton
            episode={{
              podcastId,
              title,
              podcastTitle,
              episodeId,
              publishedAt,
              durationSeconds,
              audioUrl,
              feedImage: image || '',
            }}
            // positionSeconds={playback?.positionSeconds || 0}
            // playedPercentage={playback?.playedPercentage}
          />
        ) : null}
      </Box>
    </Stack>
  );
}
