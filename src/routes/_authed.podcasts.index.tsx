import { convexQuery } from '@convex-dev/react-query';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { orderBy } from 'lodash-es';
import { useMemo, useState } from 'react';
import { Card } from '~/components/Card';
import { MuiButtonLink } from '~/components/MuiButtonLink';
import { PageHeader } from '~/components/PageHeader';
import { SubscribeIconButton } from '~/components/SubscribeIconButton';

export const Route = createFileRoute('/_authed/podcasts/')({
  component: RouteComponent,
});

type SortOption = '' | 'recent' | 'alpha';

function RouteComponent() {
  const [sort, setSort] = useState<SortOption>('recent');
  const { data } = useSuspenseQuery(convexQuery(api.subscribe.allDetails, {}));

  const sorted = useMemo(() => {
    if (sort === 'recent')
      return data.sort(
        (a, b) => (b.mostRecentEpisode || 0) - (a.mostRecentEpisode || 0),
      );
    else if (sort === 'alpha')
      return orderBy(data, [(p) => p.title.toLowerCase()], ['desc']); // sortBy(data, 'title', (d) => d.title.toLowercase());
    return data;
  }, [data, sort]);

  return (
    <Box sx={{ pt: { xs: 2, md: 3 } }}>
      <PageHeader label='podcasts' />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h4' sx={{ mb: 0.5, letterSpacing: '-0.03em' }}>
            Podcasts.
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Your subscriptions
          </Typography>
        </Box>
        <FormControl variant='standard' sx={{ minWidth: 120 }}>
          <InputLabel id='sort-pod-label'>Sort by</InputLabel>
          <Select
            labelId='sort-pod-label'
            id='sort-pod'
            value={sort}
            label='Sort by'
            onChange={(e) => setSort(e.target.value)}
            sx={{ fontSize: 13 }}
          >
            <MenuItem value={''}>Default</MenuItem>
            <MenuItem value={'recent'}>Recent</MenuItem>
            <MenuItem value={'alpha'}>Alphabetically</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {sorted.length === 0 ? (
        <Stack direction='column' spacing={2} sx={{ alignItems: 'center', py: 8 }}>
          <Typography variant='subtitle1' color='textSecondary'>
            Your followed podcasts will show up here
          </Typography>
          <MuiButtonLink to='/discover' variant='contained'>
            Explore
          </MuiButtonLink>
        </Stack>
      ) : null}

      <Grid
        container
        columnSpacing={{ xs: 1.5, sm: 1.5, md: 2 }}
        rowSpacing={{ xs: 2, sm: 3, md: 4 }}
      >
        {sorted.map((pod, i) => (
          <Grid key={pod._id} size={{ xs: 4, sm: 3, md: 2 }}>
            <Card
              orientation='vertical'
              imgSrc={pod.imageUrl || ''}
              title={pod.title}
              subtitle={pod.author}
              linkProps={{
                to: '/podcasts/$podId',
                params: { podId: pod.podcastId },
              }}
            >
              <SubscribeIconButton podcastId={pod.podcastId} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
