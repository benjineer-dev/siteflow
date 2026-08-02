import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],

    fileParallelism: false,
    maxWorkers: 1,

    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});