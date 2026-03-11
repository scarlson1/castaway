# Deployment Guide

The app is automatically deployed to Vercel when it is merged to the `main` branch. See [Tanstack Start Docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting#nitro) for details.

Nitro Vite plugin must be added to `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
});
```

## Environment Variables

The following variables should be added in the Convex production dashboard:

```env
CLERK_FRONTEND_API_URL=https://<project-url>.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_***
OPENAI_API_KEY=<open_ai_api_key>
PODCAST_INDEX_KEY=<podcast_index_key>
PODCAST_INDEX_SECRET=<podcast_index_secret>
SPOTIFY_CLIENT_ID=<spotify_client_id>
SPOTIFY_CLIENT_SECRET=<spotify_client_secret>
```
