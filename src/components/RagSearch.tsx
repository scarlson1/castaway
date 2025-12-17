import { useConvexAction } from '@convex-dev/react-query';
import { Box, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useState } from 'react';
import { useDebounce } from '~/hooks/useDebounce';

export const RagSearch = ({ podcastId }: { podcastId?: string }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  // const queryOptions = useMemo(
  //   () => ({
  //     term: debouncedQuery,
  //     first: 5,
  //     filters: props.filters,
  //     // ...props,
  //     // page:
  //     // options:
  //   }),
  //   [props, debouncedQuery]
  // );

  const searchEpisodes = useConvexAction(api.rag.searchEpisodes);

  const { data, isError, error } = useQuery({
    queryKey: ['search', 'rag', { query: debouncedQuery, podcastId }],
    queryFn: () =>
      searchEpisodes({
        query: debouncedQuery,
        filters: podcastId
          ? [{ name: 'podcastId', value: podcastId }]
          : undefined,
        globalNamespace: true,
        limit: 5,
      }),
    enabled: Boolean(debouncedQuery.trim()),
  });

  return (
    <Box sx={{ py: 3 }}>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        placeholder='search episodes'
      />
      {isError ? (
        <Typography color='error'>
          {error?.message || 'an error occurred'}
        </Typography>
      ) : null}
      <Typography component='div' variant='body2'>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Typography>
    </Box>
  );
};
