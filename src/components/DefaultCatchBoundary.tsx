import { Box, Button, Stack } from '@mui/material';
import * as Sentry from '@sentry/tanstackstart-react';
import type { ErrorComponentProps } from '@tanstack/react-router';
import {
  ErrorComponent,
  Link,
  rootRouteId,
  useCanGoBack,
  useMatch,
  useRouter,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { MuiButtonLink } from '~/components/MuiButtonLink';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  console.error(error);

  return (
    <Box
      sx={{
        minWidth: 0,
        flex: 1,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <ErrorComponent error={error} />
      <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap'>
        <Button
          variant='contained'
          color='primary'
          onClick={() => router.invalidate()}
          sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}
        >
          Try Again
        </Button>

        {isRoot ? (
          <Button
            component={Link}
            to='/'
            variant='contained'
            color='primary'
            sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}
          >
            Home
          </Button>
        ) : canGoBack ? (
          <MuiButtonLink
            to='/'
            variant='contained'
            color='primary'
            sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            onClick={(e) => {
              e.preventDefault();
              router.history.back();
              // window.history.back();
            }}
          >
            Go Back
          </MuiButtonLink>
        ) : null}
      </Stack>
    </Box>
  );
}
