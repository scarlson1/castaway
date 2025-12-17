import { TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useDebounce } from '~/hooks/useDebounce';
import {
  transcriptSearch,
  type TranscriptSearchOptions,
} from '~/serverFn/podchaser';

// not using - requires podchaser paid plan (DELETE)

export const TranscriptSearch = (
  props: Omit<TranscriptSearchOptions, 'term'>
) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const queryOptions = useMemo(
    () => ({
      term: debouncedQuery,
      first: 5,
      filters: props.filters,
      // ...props,
      // page:
      // options:
    }),
    [props, debouncedQuery]
  );

  const { data, isError, error } = useQuery({
    queryKey: ['transcript', 'search', queryOptions],
    queryFn: () => transcriptSearch({ data: queryOptions }),
    enabled: Boolean(queryOptions.term),
  });

  return (
    <>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        placeholder='search podcast episodes'
      />
      {isError ? (
        <Typography color='error'>
          {error?.message || 'an error occurred'}
        </Typography>
      ) : null}
      <Typography variant='body2' color='textSecondary' component='div'>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Typography>
    </>
  );
};
