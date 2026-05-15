import { SearchRounded } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { searchPodIndex } from '~/components/PodcastIndexSearch';
import { SubscribeIconButton } from '~/components/SubscribeIconButton';
import { useDebounce } from '~/hooks/useDebounce';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

export const AutoCompleteSearch = ({
  onSelect,
  fullWidth = false,
  compact = false,
  placeholder,
}: {
  onSelect?: (val: PodcastFeed) => void;
  fullWidth?: boolean;
  compact?: boolean;
  placeholder?: string;
}) => {
  const search = useServerFn(searchPodIndex);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [value, setValue] = useState<PodcastFeed | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [open, setOpen] = useState(false);

  const queryOptions = { query: debouncedQuery, max: 8, similar: true };

  const { data } = useQuery({
    queryKey: ['search', 'podIndex', queryOptions],
    queryFn: () => search({ data: queryOptions }),
    enabled: Boolean(query.trim()),
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  const handleOpen = () => {
    setTimeout(() => {
      setOpen(true);
    }, 400);
  };

  const width = fullWidth ? '100%' : isExpanded ? 400 : 200;

  return (
    <Autocomplete
      sx={
        compact
          ? {
              width,
              transition: 'width 0.3s ease-in-out',
              '& .MuiOutlinedInput-root': {
                borderRadius: 0.75,
                fontSize: 12,
                py: '6px !important',
                bgcolor: 'background.default',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'text.disabled' },
                '&.Mui-focused fieldset': {
                  borderColor: 'text.secondary',
                  borderWidth: 1,
                },
              },
              '& .MuiInputLabel-root': { display: 'none' },
              '& .MuiInputBase-input': {
                py: '0 !important',
                fontSize: 12,
                '&::placeholder': { color: 'text.disabled', opacity: 1 },
              },
            }
          : {
              width,
              transition: 'width 0.3s ease-in-out',
            }
      }
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
        setValue(newValue);
        if (newValue && onSelect) onSelect(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setQuery(newInputValue);
        setInputValue(newInputValue);
      }}
      open={open}
      onOpen={handleOpen}
      onClose={() => setOpen(false)}
      renderInput={({ InputProps, ...params }) => (
        <TextField
          {...params}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          label={compact ? undefined : 'Search'}
          placeholder={
            placeholder ?? (compact ? 'Search shows...' : 'Search by title')
          }
          fullWidth
          InputProps={{
            ...InputProps,
            startAdornment: (
              <InputAdornment position='start' sx={{ mx: 0.5 }}>
                <SearchRounded
                  fontSize='small'
                  sx={{
                    fontSize: compact ? 14 : undefined,
                    color: 'text.disabled',
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}
      slotProps={{
        listbox: {
          sx: { maxHeight: '80vh' },
        },
        popper: {
          placement: 'bottom-start',
        },
        paper: {
          sx: {
            width,
            transition: 'width 0.3s ease-in-out',
          },
        },
      }}
      renderOption={({ key, ...props }, option) => {
        return (
          <li
            key={key}
            {...props}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              props.onClick?.(e);
            }}
          >
            <AutoCompleteOption option={option} />
          </li>
        );
      }}
    />
  );
};

function AutoCompleteOption({ option }: { option: PodcastFeed }) {
  return (
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
        <Typography
          variant='subtitle2'
          color='textSecondary'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {option.author}
        </Typography>
      </Grid>
      <Grid size='auto' display='flex' alignItems='center'>
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <SubscribeIconButton podcastId={option.podcastGuid} />
          </Suspense>
        </ErrorBoundary>
      </Grid>
    </Grid>
  );
}
