// https://clerk.com/docs/guides/development/integrations/databases/convex
// https://docs.convex.dev/auth/clerk#tanstack-start

import type { AuthConfig } from 'convex/server';

export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
