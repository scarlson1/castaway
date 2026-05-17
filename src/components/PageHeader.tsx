import { Box, Typography } from '@mui/material';
import { useHotkeys } from '@tanstack/react-hotkeys';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';
import { AutoCompleteSearch, type AutoCompleteSearchHandle } from '~/components/AutoCompleteSearch';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

interface PageHeaderProps {
  label: string;
  searchPlaceholder?: string;
}

export const PageHeader = ({ label, searchPlaceholder }: PageHeaderProps) => {
  const navigate = useNavigate();

  const searchRef = useRef<AutoCompleteSearchHandle>(null);

  useHotkeys([{ hotkey: 'Mod+K', callback: () => searchRef.current?.focus() }]);

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
        ref={searchRef}
        onSelect={goToPod}
        compact
        placeholder={searchPlaceholder}
      />
    </Box>
  );
};
