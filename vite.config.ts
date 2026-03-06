import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { loadEnv } from 'vite';
import { sentrySvelteKit } from '@sentry/sveltekit';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tailwindcss(),
      sentrySvelteKit({
        org: 'emadev',
        project: 'devmotion'
      }),
      sveltekit(),
      devtoolsJson()
    ],
    ssr: {
      external: ['@resvg/resvg-js']
    },
    server: {
      allowedHosts: [
        (env.PUBLIC_BASE_URL ?? 'http://localhost').replace('http://', '').replace('https://', '')
      ]
    },
    test: {
      expect: { requireAssertions: true },
      projects: [
        {
          extends: './vite.config.ts',
          test: {
            name: 'client',
            environment: 'browser',
            browser: {
              enabled: true,
              provider: 'playwright',
              instances: [{ browser: 'chromium' }]
            },
            include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
            exclude: ['src/lib/server/**'],
            setupFiles: ['./vitest-setup-client.ts']
          }
        },
        {
          extends: './vite.config.ts',
          test: {
            name: 'server',
            environment: 'node',
            include: ['src/**/*.{test,spec}.{js,ts}'],
            exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
          }
        }
      ]
    }
  };
});
