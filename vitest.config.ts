import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['convex/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': '/Users/spencercarlson/Documents/dev/castaway/src',
      convex: '/Users/spencercarlson/Documents/dev/castaway/convex',
    },
  },
});
