// src/router.tsx
import { ConvexQueryClient } from '@convex-dev/react-query';
import * as Sentry from '@sentry/tanstackstart-react';
import { QueryClient } from '@tanstack/react-query';
import { createRouter, ErrorComponent } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { ConvexReactClient } from 'convex/react';
import { useEffect } from 'react';
import { env } from '~/utils/env.validation';
import { routeTree } from './routeTree.gen';

// docs: https://docs.convex.dev/client/tanstack/tanstack-start/clerk

export function getRouter() {
  const convex = new ConvexReactClient(env.VITE_CONVEX_URL, {
    unsavedChangesWarning: false,
  });
  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5, // 5 mins
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    // optionally expose the QueryClient via router context
    context: {
      queryClient,
      convexClient: convex,
      convexQueryClient,
      userId: null,
      token: null,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadDelay: 100,
    defaultErrorComponent: ({ error }) => {
      useEffect(() => {
        Sentry.captureException(error);
      }, [error]);

      return <ErrorComponent error={error} />;
    },
    // defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <p>not found</p>,
    // USED IN DOCS BUT DUPLICATES <ConvexProviderWithClerk>
    // Wrap: ({ children }) => (
    //   <ConvexProvider client={convexQueryClient.convexClient}>
    //     {children}
    //   </ConvexProvider>
    // ),
    // Wrap: ({ children }) => (
    //   <ClerkProvider
    //     publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
    //     appearance={{
    //       variables: {
    //         colorPrimary: `var(--palette-primary-main)`,
    //         colorPrimaryForeground: `var(--palette-text-primary)`,
    //         colorForeground: `var(--palette-text-primary)`, // default text
    //         colorMuted: `var(--palette-background-default)`,
    //         colorMutedForeground: `var(--palette-text-secondary)`, // secondary text
    //         colorNeutral: `var(--palette-text-secondary)`,
    //         colorBackground: `var(--palette-background-paper)`,
    //         colorBorder: `var(--palette-grey-500)`, // clerk adds additional opacity
    //         colorDanger: `var(--palette-error-main)`,
    //         colorSuccess: `var(--palette-success-main)`,
    //         colorWarning: `var(--palette-warning-main)`,
    //         colorInputForeground: `var(--palette-text-primary)`,
    //         colorInput: `var(--palette-background-default)`, // input background
    //         // fontFamily:
    //         spacing: '0.875rem',
    //       },
    //       layout: {
    //         logoImageUrl: castawayLogo,
    //       },
    //       elements: {
    //         socialButtonsIconButton: {
    //           border: `1px solid var(--palette-divider) !important`,
    //           background: `var(--palette-grey-100)`,
    //         },
    //       },
    //     }}
    //   >
    //     <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    //       {children}
    //     </ConvexProviderWithClerk>
    //   </ClerkProvider>
    // ),
  });
  // TANSTACK DOCKS IMPLEMENTATION: https://tanstack.com/start/latest/docs/framework/react/examples/start-convex-trellaux
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    // optional:
    // handleRedirects: true,
    // wrapQueryClient: true, // automatically wraps with QueryClientProvider (default: true)
  });

  if (!router.isServer) {
    Sentry.init({
      dsn: env.VITE_SENTRY_DNS,
      // tunnel: '/tunnel',
      environment: env.MODE,

      // Adds request headers and IP for users, for more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
      sendDefaultPii: true,
      // integrations: []
    });
  }

  return router;

  // CONVEX DOCS IMPLEMENTATION: https://docs.convex.dev/client/tanstack/tanstack-start/clerk
  // older integration helper from TanStack Router v1 for client-only apps using React Query.
  // let routerWithConvex = routerWithQueryClient(router,queryClient)
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

// export function getRouter() {
//   const queryClient = new QueryClient();

//   const router = createRouter({
//     routeTree,
//     // optionally expose the QueryClient via router context
//     context: {
//       queryClient,
//       // user: null,
//     },
//     scrollRestoration: true,
//     defaultPreload: 'intent',
//     defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
//     defaultNotFoundComponent: () => <p>not found</p>,
//   });
//   setupRouterSsrQueryIntegration({
//     router,
//     queryClient,
//     // optional:
//     // handleRedirects: true,
//     // wrapQueryClient: true, // automatically wraps with QueryClientProvider (default: true)
//   });

//   return router;
// }

// declare module '@tanstack/react-router' {
//   interface Register {
//     router: ReturnType<typeof getRouter>;
//   }
// }
