import { Container, Stack, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { AutoCompleteSearch } from '~/components/AutoCompleteSearch';
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
      <Typography variant='h1' marginBlockEnd={4}>
        Castaway
      </Typography>

      <Container maxWidth='sm'>
        {/* <PodcastIndexSearch /> */}
        <AutoCompleteSearch onSelect={handleSelect} />
      </Container>

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
