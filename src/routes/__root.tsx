/// <reference types="vite/client" />
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { convexQuery, type ConvexQueryClient } from '@convex-dev/react-query';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import fontsourceVariableRobotoCss from '@fontsource-variable/roboto?url';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { createServerFn } from '@tanstack/react-start';
import { api } from 'convex/_generated/api';
import type { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { format } from 'date-fns';
import { Suspense, useMemo, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import castawayLogo from '~/assets/castaway-light.png';
import { AppHeader } from '~/components/AppHeader';
import AudioPlayer from '~/components/AudioPlayerGPT';
import { Toaster } from '~/components/Toaster';
import { useQueue } from '~/hooks/useQueue';
import { theme } from '~/theme/theme';
import { env } from '~/utils/env.validation';

export const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(
  async () => {
    const a = await auth();
    const { userId, orgId, isAuthenticated } = a;
    const token = await a.getToken({ template: 'convex' });

    return {
      userId,
      orgId,
      // sessionClaims,
      isAuthenticated,
      token,
    };
  }
);

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  // user: User | null;
}>()({
  beforeLoad: async ({ context }) => {
    // TODO: move to _authed ??
    const { userId, token } = await fetchClerkAuth();

    // During SSR only (the only time serverHttpClient exists),
    // set the Clerk auth token to make HTTP queries with.
    if (token) context.convexQueryClient.serverHttpClient?.setAuth(token);

    return {
      userId,
      token,
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
  const context = Route.useRouteContext(); // useRouteContext({ from: Route.id })

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
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function Providers({ children }: { children: ReactNode }) {
  const emotionCache = createCache({ key: 'css' });

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme} defaultMode='system'>
        <CssBaseline enableColorScheme />
        <Toaster />
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
          <ErrorBoundary fallback={<div />} onError={console.log}>
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
                }}
              >
                <WrappedPlayer />
              </Box>
            </Suspense>
          </ErrorBoundary>
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
  const userPlayback = useQuery(convexQuery(api.playback.getAllForUser, {}));
  const episode = useQueue((state) => state.nowPlaying);

  console.log(episode);

  // TODO: better cache refresh solution (not needed ?? convex should pick up new records)
  // need to refresh cache when new item is played (only syncs initially returned?)
  // useEffect(() => {
  //   let t = setTimeout(() => {
  //     console.log('REFRESHING userPlayback getAllForUser');
  //     userPlayback.refetch();
  //   }, 1000);
  //   return () => clearTimeout(t);
  // }, [episode]);

  const savedPosition = useMemo(() => {
    const playbackIndex = userPlayback?.data?.findIndex(
      (pb) => pb.episodeId === episode?.episodeId
    );
    if (playbackIndex !== undefined) {
      const playback = userPlayback.data?.[playbackIndex];
      return playback?.positionSeconds || 0;
    }
  }, [episode, userPlayback]);

  if (!episode) return null;

  return (
    <AudioPlayer
      coverArt={episode.image}
      id={episode.episodeId}
      title={episode.title}
      src={episode.audioUrl}
      releaseDate={
        episode.releaseDateMs
          ? format(new Date(episode.releaseDateMs), 'MMM d')
          : ''
      }
      podName={episode.podName}
      savedPosition={savedPosition || 0}
    />
  );

  // return (
  //   <AudioPlayerPersist
  //     coverArt={episode.image}
  //     id={episode.episodeId}
  //     title={episode.title}
  //     src={episode.audioUrl}
  //     releaseDate={
  //       episode.releaseDateMs
  //         ? format(new Date(episode.releaseDateMs), 'MMM d')
  //         : ''
  //     }
  //     podName={episode.podName}
  //     savedPosition={savedPosition || 0}
  //   />
  // );
}
