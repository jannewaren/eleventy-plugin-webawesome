import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Eleventy programmatic runs can take a moment to spin up.
    testTimeout: 30000,
  },
});
