import { AddRounded, SearchRounded } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Grid,
  IconButton,
  InputAdornment,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { searchPodIndex } from '~/components/PodcastIndexSearch';
import { useDebounce } from '~/hooks/useDebounce';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

export const AutoCompleteSearch = ({
  onSelect,
}: {
  onSelect?: (val: PodcastFeed) => void;
}) => {
  const search = useServerFn(searchPodIndex);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [value, setValue] = useState<PodcastFeed | null>(null);
  const [inputValue, setInputValue] = useState('');
  // const [options, setOptions] = useState<readonly PlaceType[]>(emptyOptions);
  const [isExpanded, setIsExpanded] = useState(false);

  const queryOptions = { query: debouncedQuery, max: 8, similar: true };

  const { data, isFetching } = useQuery({
    queryKey: ['search', 'podIndex', queryOptions],
    queryFn: () => search({ data: queryOptions }),
    enabled: Boolean(query),
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  return (
    <Autocomplete
      sx={{
        width: isExpanded ? 400 : 200,
        transition: 'width 0.3s ease-in-out',
      }}
      size='small'
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.title
      }
      filterOptions={(x) => x}
      options={data || []}
      autoComplete
      clearOnBlur={false}
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(event: any, newValue: PodcastFeed | null) => {
        console.log('ON CHANGE: ', newValue);
        // setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        if (newValue) onSelect?.(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        console.log('SET INPUT VALUE:', newInputValue);
        setQuery(newInputValue);
        setInputValue(newInputValue);
      }}
      renderInput={({ InputProps, ...params }) => (
        <TextField
          {...params}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          label='Search by title'
          fullWidth
          InputProps={{
            ...InputProps,
            startAdornment: (
              <InputAdornment position='start'>
                <SearchRounded color='secondary' fontSize='small' />
              </InputAdornment>
            ),
          }}
          // sx={{
          //   width: isExpanded ? 400 : 200,
          //   transition: 'width 0.3s ease-in-out',
          // }}
          // slotProps={{
          //   ...InputProps,
          //   input: {
          //     startAdornment: (
          //       <InputAdornment position='start' sx={{ ml: '4px', mr: '4px' }}>
          //         <SearchRounded color='secondary' fontSize='small' />
          //       </InputAdornment>
          //     ),
          //   },
          // }}
        />
      )}
      slots={{
        popper: RepositionPopper,
      }}
      slotProps={{
        listbox: {
          sx: { maxHeight: '80vh' },
        },
        popper: {
          placement: 'bottom-start',
        },
        paper: {
          sx: {
            width: isExpanded ? 400 : 200,
            transition: 'width 0.3s ease-in-out',
          },
        },
      }}
      renderOption={({ key, ...props }, option) => {
        return (
          <li key={key} {...props}>
            <Grid container spacing={1} sx={{ width: '100%' }}>
              <Grid size='auto'>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    objectFit: 'cover',
                    overflow: 'hidden',
                    flex: '0 0 52px',
                    borderRadius: 1,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    '& > img': {
                      width: '100%',
                    },
                  }}
                >
                  <img
                    src={option.artwork || option.image || ''}
                    alt={`${option.title} cover art`}
                  />
                </Box>
              </Grid>
              <Grid size='grow' sx={{ minWidth: 0, flexGrow: '1' }}>
                <Typography
                  variant='body1'
                  fontWeight='medium'
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.title}
                </Typography>
                <Typography variant='subtitle2' color='textSecondary'>
                  {option.author}
                </Typography>
              </Grid>
              <Grid size='auto'>
                <IconButton
                  size='small'
                  onClick={() => alert('TODO: follow pod')}
                >
                  <AddRounded fontSize='inherit' />
                </IconButton>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
};

function RepositionPopper(props) {
  const { anchorEl, open, popperRef, ...other } = props;

  useEffect(() => {
    if (popperRef?.current) {
      popperRef.current.update();
    }
  });

  return (
    <Popper anchorEl={anchorEl} open={open} popperRef={popperRef} {...other} />
  );
}
