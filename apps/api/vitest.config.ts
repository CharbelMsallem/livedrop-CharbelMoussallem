// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Define the environment as Node.js for backend tests
    environment: 'node',
    // Point to the test files in the root tests directory
    include: ['../../tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // You might need a setup file for mocks specific to the API tests later
    // setupFiles: './src/test/setup.ts',
  },
  ssr: {
    external: ['mongodb'],
    },
});