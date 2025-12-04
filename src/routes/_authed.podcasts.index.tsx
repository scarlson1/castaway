import { convexQuery } from '@convex-dev/react-query';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { sortBy } from 'lodash-es';
import { useMemo, useState } from 'react';
import { TrendingCardPodIndex } from '~/components/TrendingCardPodIndex';
import type { PodcastFeed } from '~/lib/podcastIndexTypes';

export const Route = createFileRoute('/_authed/podcasts/')({
  component: RouteComponent,
});

type SortOption = '' | 'recent' | 'alpha';

function RouteComponent() {
  const [sort, setSort] = useState<SortOption>('recent');
  const { data } = useSuspenseQuery(convexQuery(api.subscribe.allDetails, {}));

  const sorted = useMemo(() => {
    if (sort === 'recent')
      return data.sort((a, b) => b.lastFetchedAt - a.lastFetchedAt);
    else if (sort === 'alpha') return sortBy(data, 'title');
    return data;
  }, [data, sort]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Typography variant='h4' gutterBottom>
          My Podcasts
        </Typography>
        <FormControl variant='standard' fullWidth sx={{ maxWidth: 200 }}>
          <InputLabel id='sort-pod-label'>Sort by</InputLabel>
          <Select
            labelId='sort-pod-label'
            id='sort-pod'
            value={sort}
            label='Sort by'
            onChange={(e) => setSort(e.target.value)}
          >
            <MenuItem value={''}>Default</MenuItem>
            <MenuItem value={'recent'}>Recent</MenuItem>
            <MenuItem value={'alpha'}>Alphabetically</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid
        container
        columnSpacing={{ xs: 2, sm: 1.5, md: 2 }}
        rowSpacing={{ xs: 2, sm: 3, md: 4 }}
      >
        {sorted.map((pod, i) => (
          <Grid key={pod._id} size={{ xs: 6, sm: 3, md: 2 }}>
            <TrendingCardPodIndex
              feed={
                // TODO: fix TrendingCard type
                {
                  id: pod.podcastId as unknown as number,
                  podcastGuid: pod.podcastId,
                  artwork: pod.imageUrl || '',
                  title: pod.title,
                  author: pod.author,
                  itunesId: pod.itunesId,
                } as PodcastFeed
              }
              orientation='vertical'
              // TODO: switch to using guid ?? or add podIndexId
              linkProps={{
                to: '/podcasts/$podId',
                params: { podId: pod.podcastId },
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
