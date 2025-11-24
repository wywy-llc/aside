import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'template/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'test/**/*.test.ts',
      'template/**/*.test.ts',
      'template-ui/**/*.test.ts',
    ],
  },
});
