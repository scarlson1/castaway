import { Alert, Box, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/podcasts')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <div>Hello "/podcasts"!</div>
      <Typography variant='h4' gutterBottom>
        My Podcasts
      </Typography>
      <Alert sx={{ maxWidth: 400, my: 4, mx: 'auto' }}>
        TODO: subscribed podcasts for user
      </Alert>
    </Box>
  );
}
