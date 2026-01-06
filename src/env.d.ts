/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client-side environment variables
  readonly VITE_APP_NAME: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_SENTRY_DNS: string;

  // readonly VITE_API_URL: string
  // readonly VITE_AUTH0_DOMAIN: string
  // readonly VITE_AUTH0_CLIENT_ID: string
  // readonly VITE_SENTRY_DSN?: string
  // readonly VITE_ENABLE_NEW_DASHBOARD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Server-side environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly PODCAST_INDEX_KEY: string;
      readonly PODCAST_INDEX_SECRET: string;
      readonly CONVEX_DEPLOYMENT: string;
      readonly CLERK_SECRET_KEY: string;
      readonly CLERK_FRONTEND_API_URL: string;
      readonly COOKIE_SECRET: string;
      readonly PODCHASER_URL: string;
      readonly PODCHASER_SECRET: string;
      readonly PODCHASER_API_KEY: string;
      readonly IMPORT_EPISODE_LIMIT: string;
      readonly SPOTIFY_CLIENT_ID: string;
      readonly SPOTIFY_CLIENT_SECRET: string;
      // readonly JWT_SECRET: string
      // readonly AUTH0_CLIENT_SECRET: string
      // readonly STRIPE_SECRET_KEY: string
      // readonly NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {};
