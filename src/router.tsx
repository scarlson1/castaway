// src/router.tsx
import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
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
      // user: null,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
    // defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <p>not found</p>,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    ),
  });
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    // optional:
    // handleRedirects: true,
    // wrapQueryClient: true, // automatically wraps with QueryClientProvider (default: true)
  });

  return router;
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
