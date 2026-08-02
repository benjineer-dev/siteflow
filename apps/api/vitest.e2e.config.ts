import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
    src: fileURLToPath(
      new URL('./src', import.meta.url),
    ),
    '@': fileURLToPath(
      new URL('./src', import.meta.url),
    ),
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