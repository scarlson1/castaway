/// <reference types="vite/client" />
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import fontsourceVariableRobotoCss from '@fontsource-variable/roboto?url';
import { Container, CssBaseline, ThemeProvider } from '@mui/material';
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
import type { ReactNode } from 'react';
import { AppHeader } from '~/components/AppHeader';
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
    <ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}>
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
        </Providers>

        <TanStackRouterDevtools position='bottom-left' />
        <ReactQueryDevtools initialIsOpen={false} />
        <Scripts />
      </body>
    </html>
  );
}
