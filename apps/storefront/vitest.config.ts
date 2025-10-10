import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Tell Vitest where to find your tests
    include: ['src/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Ignore Storybook's config and other files
    exclude: ['.storybook', 'src/stories'],
    css: true,
  },
});