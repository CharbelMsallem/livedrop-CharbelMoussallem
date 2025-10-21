import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
// Only include tests within the storefront's src directory
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Explicitly exclude the root tests directory for this run
    exclude: ['.storybook', 'src/stories', '../../tests'],
    css: true,
  },
});