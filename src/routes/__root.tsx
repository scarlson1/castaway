/// <reference types="vite/client" />
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import { type ConvexQueryClient } from '@convex-dev/react-query';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import fontsourceVariableRobotoCss from '@fontsource-variable/roboto?url';
import {
  Box,
  Container,
  CssBaseline,
  InitColorSchemeScript,
  ThemeProvider,
} from '@mui/material';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import type { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { format } from 'date-fns';
import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import castawayLogo from '~/assets/castaway-light.png';
import { AppHeader } from '~/components/AppHeader';
import AudioPlayer from '~/components/AudioPlayer/index';
import { Toaster } from '~/components/Toaster';
import { useQueueStore } from '~/hooks/useQueueStore';
import { getCachedClerkAuth } from '~/serverFn/auth';
import { modeStorageKey, theme } from '~/theme/theme';
import { env } from '~/utils/env.validation';

export interface RouterContext {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  userId: string | null;
  token: string | null;
  // user: User | null;
}

// TODO: cache the fetchClerkAuth()
// verify token: https://clerk.com/docs/reference/backend/verify-token (expiration/refresh etc.)
// Networkless if the jwtKey is provided

export const Route = createRootRouteWithContext<RouterContext>()({
  // beforeLoad: async (ctx) => {
  //   const auth = await getClerkTokenWithCookie();

  //   // If we fetched a fresh token (from Clerk), set cookie so subsequent requests reuse it.
  //   if (!auth.fromCookie && auth.userId && auth.token) {
  //     const setCookieHeader = makeSetClerkCookieHeader({
  //       token: auth.token,
  //       userId: auth.userId,
  //       expiresAt: auth.expiresAt,
  //     });

  //     // Approach A: if your framework exposes ctx.responseHeaders (as in earlier snippets)
  //     const headers = new Headers();
  //     headers.set('set-cookie', setCookieHeader);
  //     setResponseHeaders(headers);
  //     // if (!ctx.responseHeaders) ctx.responseHeaders = new Headers()
  //     // ctx.responseHeaders.append("set-cookie", setCookieHeader)

  //     // Approach B: alternatively return headers from loader if your app expects that:
  //     // return { userId: auth.userId, token: auth.token, headers: { 'Set-Cookie': setCookieHeader } }
  //   }

  //   if (auth.token && ctx.context.convexQueryClient.serverHttpClient)
  //     ctx.context.convexQueryClient.serverHttpClient.setAuth(auth.token);

  //   return { userId: auth.userId,token: auth.token,};
  // },

  beforeLoad: async (ctx) => {
    // const { userId, token } = await fetchClerkAuth();
    // TODO: used cookie based solution ??
    const { userId, token } = await getCachedClerkAuth();

    // During SSR only (the only time serverHttpClient exists),
    // set the Clerk auth token to make HTTP queries with.
    if (token) {
      console.log('SETTING CONVEX CLIENT TOKEN');
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

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
  const context = Route.useRouteContext();

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
  const emotionCache = createCache({ key: 'emotion-css' });

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider
        theme={theme}
        defaultMode='system'
        modeStorageKey={modeStorageKey}
      >
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
    <html lang='en' suppressHydrationWarning>
      <head>
        <HeadContent />
        <InitColorSchemeScript
          attribute='data'
          defaultMode='system'
          modeStorageKey={modeStorageKey}
        />
      </head>
      <body>
        <Providers>
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
              <AudioPlayerBottomSpacer />
            </Suspense>
          </ErrorBoundary>
        </Providers>

        <TanStackDevtools
          plugins={[
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
              defaultOpen: false,
            },
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
              defaultOpen: false,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function WrappedPlayer() {
  // const userPlayback = useQuery(convexQuery(api.playback.getAllForUser, {}));
  const episode = useQueueStore((state) => state.nowPlaying);

  // const dbPlayback = useMemo(() => {
  //   const playbackIndex = userPlayback?.data?.findIndex(
  //     (pb) => pb.episodeId === episode?.episodeId
  //   );
  //   if (!playbackIndex) return {};

  //   const playback = userPlayback.data?.[playbackIndex];

  //   return playback?.positionSeconds
  //     ? {
  //         position: playback.positionSeconds,
  //         duration: playback.duration,
  //       }
  //     : {};
  // }, [episode, userPlayback]);

  if (!episode) return null;

  return (
    <AudioPlayer
      coverArt={episode.image}
      podcastId={episode.podcastId}
      id={episode.episodeId}
      title={episode.title}
      src={episode.audioUrl}
      releaseDate={
        episode.releaseDateMs
          ? format(new Date(episode.releaseDateMs), 'MMM d')
          : ''
      }
      podName={episode.podName}
      // dbPlayback={dbPlayback}
    />
  );
}

function AudioPlayerBottomSpacer() {
  const episode = useQueueStore((state) => state.nowPlaying);
  const show = Boolean(episode);
  return (
    <Box
      sx={{ height: show ? 140 : 0, transition: 'height 0.3s ease-in-out' }}
    />
  );
}
