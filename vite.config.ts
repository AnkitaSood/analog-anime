/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: ['es2020'],
    // Emit source maps for Sentry but don't serve them publicly
    sourcemap: 'hidden',
  },
  resolve: {
    mainFields: ['module'],
    tsconfigPaths: true,
  },
  plugins: [
    analog(),
    tailwindcss(),
    // Upload source maps to Sentry so browser stack traces are readable.
    // Skipped when SENTRY_AUTH_TOKEN is missing (e.g. local dev builds).
    ...(process.env['SENTRY_AUTH_TOKEN']
      ? [
          sentryVitePlugin({
            org: process.env['SENTRY_ORG'],
            project: process.env['SENTRY_PROJECT'],
            authToken: process.env['SENTRY_AUTH_TOKEN'],
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
          }),
        ]
      : []),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
