import { defineConfig } from 'vitest/config';

export default defineConfig({
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
