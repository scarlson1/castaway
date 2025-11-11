import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ['@mui/*'],
  },
  plugins: [tsConfigPaths(), tanstackStart(), viteReact()],
  envPrefix: ['CLERK_SIGN_IN_', 'CLERK_SIGN_UP_', 'VITE_'],
});
