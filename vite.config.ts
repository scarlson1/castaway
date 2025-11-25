import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    port: 3000,
  },
  // ssr: {
  //   noExternal: ['@mui/*', '@emotion/*'],
  // },
  ...(process.env.NODE_ENV === 'production' && {
    ssr: {
      noExternal: ['@mui/*'],
    },
  }),
  optimizeDeps: {
    include: ['@emotion/styled'],
  },
  plugins: [tsConfigPaths(), devtools(), tanstackStart(), nitro(), viteReact()],
  nitro: {
    preset: 'vercel',
  },
  envPrefix: ['CLERK_SIGN_IN_', 'CLERK_SIGN_UP_', 'VITE_'],
});
