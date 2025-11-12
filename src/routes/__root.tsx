/// <reference types="vite/client" />
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import fontsourceVariableRobotoCss from '@fontsource-variable/roboto?url';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { createServerFn } from '@tanstack/react-start';
import { format } from 'date-fns';
import { Suspense, type ReactNode } from 'react';
import castawayLogo from '~/assets/castaway-light.png';
import { AppHeader } from '~/components/AppHeader';
import AudioPlayer from '~/components/AudioPlayer';
import { useQueue } from '~/hooks/useQueue';
import { theme } from '~/theme/theme';
import { env } from '~/utils/env.validation';

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId, orgId, isAuthenticated } = await auth();

  return {
    userId,
    orgId,
    // sessionClaims,
    isAuthenticated,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  // user: User | null;
}>()({
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth();

    console.log('userId: ', userId);

    return {
      userId,
    };
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start',
      },
    ],
    links: [{ rel: 'stylesheet', href: fontsourceVariableRobotoCss }],
  }),
  component: RootComponent,
  // notFoundComponent: () => <NotFound />,
  // errorComponent: (props) => {
  //   return (
  //     <RootDocument>
  //       <DefaultCatchBoundary {...props} />
  //     </RootDocument>
  //   );
  // },
});

function RootComponent() {
  return (
    <ClerkProvider
      publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: `var(--palette-primary-main)`,
          colorPrimaryForeground: `var(--palette-text-primary)`,
          colorForeground: `var(--palette-text-primary)`, // default text
          colorMuted: `var(--palette-background-default)`,
          colorMutedForeground: `var(--palette-text-secondary)`, // secondary text
          colorNeutral: `var(--palette-text-secondary)`,
          colorBackground: `var(--palette-background-paper)`,
          colorBorder: `var(--palette-grey-500)`, // clerk adds additional opacity
          colorDanger: `var(--palette-error-main)`,
          colorSuccess: `var(--palette-success-main)`,
          colorWarning: `var(--palette-warning-main)`,
          colorInputForeground: `var(--palette-text-primary)`,
          colorInput: `var(--palette-background-default)`, // input background
          // fontFamily:
          spacing: '0.875rem',
        },
        layout: {
          logoImageUrl: castawayLogo,
        },
        elements: {
          socialButtonsIconButton: {
            border: `1px solid var(--palette-divider) !important`,
            background: `var(--palette-grey-100)`,
          },
        },
      }}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ClerkProvider>
  );
}

function Providers({ children }: { children: ReactNode }) {
  const emotionCache = createCache({ key: 'css' });

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme} defaultMode='system'>
        <CssBaseline enableColorScheme />
        {children}
        {/* <FirebaseAppContext>
          <FirebaseServicesContext>{children}</FirebaseServicesContext>
        </FirebaseAppContext> */}
      </ThemeProvider>
    </CacheProvider>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en'>
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>
          {/* <Header /> */}
          <AppHeader />

          <Container component='main' sx={{ paddingBlock: 4 }}>
            {children}
          </Container>
          <Suspense>
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: (theme) => theme.zIndex.drawer,
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
                // p: 3,
                // bgcolor: 'grey.900',
                // color: 'white',
                // borderRadius: 3,
              }}
            >
              <WrappedPlayer />
            </Box>
          </Suspense>
        </Providers>

        <TanStackRouterDevtools position='bottom-left' />
        <ReactQueryDevtools initialIsOpen={false} />
        <Scripts />
      </body>
    </html>
  );
}

// temp for testing zustand
function WrappedPlayer() {
  const episode = useQueue((state) => state.nowPlaying);

  if (!episode) return null;

  return (
    <AudioPlayer
      coverArt={episode.image || episode.feedImage}
      id={episode.guid}
      title={episode.title}
      src={episode.enclosureUrl}
      releaseDate={
        episode.datePublished
          ? format(new Date(episode.datePublished * 1000), 'MMM d')
          : ''
      }
      podName={episode.podTitle}
    />
  );
}
