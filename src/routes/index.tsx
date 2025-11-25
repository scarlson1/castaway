import { Box, Stack } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const navigate = Route.useNavigate();

  const handleSelect = useCallback(
    (pod: PodcastFeed) => {
      console.log('NAV', pod);
      navigate({ to: '/podcast/$podId', params: { podId: pod.id.toString() } });
    },
    [navigate]
  );

  return (
    <Stack alignItems='center'>
      {/* <Typography variant='h1' marginBlockEnd={4}>
        Castaway
      </Typography> */}

      {/* TODO: Signed in wrapper component */}

      <Box></Box>

      {/* <PodcastIndexSearch /> */}
      {/* <Container maxWidth='sm'>
        
        <AutoCompleteSearch onSelect={handleSelect} />
      </Container> */}

      {/* <button
        onClick={() => {
          fetch('/api/search', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // body: JSON.stringify({ name: 'Spencer' }),
          })
            .then((res) => res.json())
            .then((data) => console.log(data));
        }}
      >
        Say Hello
      </button> */}
    </Stack>
  );
}
