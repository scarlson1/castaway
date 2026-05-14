import { Box, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { AutoCompleteSearch } from '~/components/AutoCompleteSearch';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

interface PageHeaderProps {
  label: string;
  searchPlaceholder?: string;
}

export const PageHeader = ({ label, searchPlaceholder }: PageHeaderProps) => {
  const navigate = useNavigate();

  const goToPod = useCallback(
    (pod: PodcastFeed) => {
      navigate({ to: '/podcast/$podId', params: { podId: pod.id.toString() } });
    },
    [navigate],
  );

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        mb: 2,
      }}
    >
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'text.disabled',
          flex: 1,
          minWidth: 0,
        }}
      >
        workspace / {label}
      </Typography>
      <AutoCompleteSearch
        onSelect={goToPod}
        compact
        placeholder={searchPlaceholder}
      />
    </Box>
  );
};
