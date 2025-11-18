import { SearchRounded } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Fade,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { useCallback, useState } from 'react';
import { useDebounce } from '~/hooks/useDebounce';
import { getPodClient } from '~/lib/podcastIndexClient';
import {
  searchByTermSchema,
  type PodcastFeed,
  type SearchByTermResult,
} from '~/lib/podcastIndexTypes';

export const searchPodIndex = createServerFn({ method: 'GET' })
  .inputValidator(searchByTermSchema)
  .handler(async ({ data }) => {
    const podClient = getPodClient();
    const results = await podClient.searchByTerm(data);

    return results.feeds || [];
  });

export const PodcastIndexSearch = () => {
  const search = useServerFn(searchPodIndex);
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const queryOptions = { query: debouncedQuery, max: 8, similar: true };

  const { data, isFetching } = useQuery({
    queryKey: ['search', 'podIndex', queryOptions],
    queryFn: () => search({ data: queryOptions }),
    enabled: Boolean(query),
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  // alternatively use CSS selector :focus-within
  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <TextField
        label='Search'
        placeholder='search by title'
        value={query}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setQuery(event.target.value)
        }
        onFocus={() => handleFocus()}
        onBlur={() => handleBlur()}
        sx={{
          width: isExpanded ? 400 : 200,
          transition: 'width 0.2s ease-in-out',
          maxWidth: 400,
        }}
        margin='dense'
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchRounded />
              </InputAdornment>
            ),
            // isFetching ? (
            endAdornment: (
              <InputAdornment position='start'>
                <Fade in={isFetching}>
                  <CircularProgress size={18} />
                </Fade>
              </InputAdornment>
            ),
            // ) : null
          },
        }}
      />
      <SearchResults results={data || []} />
    </>
  );
};

function SearchResults({ results }: { results: SearchByTermResult['feeds'] }) {
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (pod: PodcastFeed) => {
      navigate({
        to: '/podcast/$podId',
        params: { podId: `${pod.id}` },
      });
    },
    [navigate]
  );

  return (
    <>
      {results.map((h) => (
        <Box
          display='flex'
          id={h.podcastGuid}
          sx={{ my: 1, '&:hover': { cursor: 'pointer' } }}
          onClick={() => handleSelect(h)}
        >
          <Box
            sx={{
              flex: '0 0 80px',
              height: 80,
              objectFit: 'cover',
              overflow: 'hidden',
              borderRadius: 1,
              '& > img': { width: '100%' },
            }}
          >
            <img src={h.artwork || h.image || ''} alt={`${h.title} artwork`} />
          </Box>
          <Box sx={{ px: 2, minWidth: 0 }}>
            <Typography
              variant='h6'
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {h.title}
            </Typography>
            <Typography
              variant='subtitle1'
              color='textSecondary'
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {h.author}
            </Typography>
          </Box>
        </Box>
      ))}
    </>
  );
}
