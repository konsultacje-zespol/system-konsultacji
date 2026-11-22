import { defineConfig } from 'vitest/config';

// Integration tests: real Express app + real database konsultacje_test.
export default defineConfig({
  test: {
    include: ['test/**/*.int.test.js'],
    environment: 'node',
    globalSetup: ['test/global-setup.js'],
    // all test files share one database, so they must run one after another
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
