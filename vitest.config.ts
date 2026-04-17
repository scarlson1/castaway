import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // vite-tsconfig-paths falls back to normal resolution (node_modules) when a
    // mapped path doesn't resolve to an existing file. This is what we need for
    // the convex/* alias: local files like convex/playback resolve to the local
    // directory, while npm package subpaths like convex/server fall through to
    // node_modules.
    tsconfigPaths({ projects: ['./convex/tsconfig.json', './tsconfig.json'] }),
  ],
  test: {
    include: ['convex/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
