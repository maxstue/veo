import { cloudflare } from '@cloudflare/vite-plugin';
import babel from '@rolldown/plugin-babel';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';
import { defineConfig, lazyPlugins, loadEnv } from 'vite-plus';

import oxfmtConfig from './oxfmt.config';
import oxlintConfig from './oxlint.config';

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const collectE2ECoverage = env.VITE_COVERAGE === 'true';

  return {
    build: collectE2ECoverage ? { sourcemap: true } : undefined,
    staged: {
      '*': 'vp check --fix',
    },
    fmt: oxfmtConfig,
    lint: oxlintConfig,
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      passWithNoTests: true,
      reporters: process.env.GITHUB_ACTIONS === 'true' ? ['default', 'github-actions'] : ['default'],
      coverage: {
        exclude: ['src/**/*.test.{ts,tsx}', 'src/routeTree.gen.ts', 'src/vite-env.d.ts'],
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: 'coverage/unit',
      },
    },
    resolve: { tsconfigPaths: true },
    plugins: lazyPlugins(() => [
      devtools(),
      mode === 'test' ? undefined : cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tailwindcss(),
      tanstackStart({
        start: { entry: 'app/start.ts' },
        router: { entry: 'app/router.tsx' },
        client: { entry: 'app/client.tsx' },
        server: { entry: 'app/server.ts' },
      }),
      viteReact(),
      babel({
        presets: [reactCompilerPreset()],
      }),
      collectE2ECoverage
        ? istanbul({
            include: ['src/**/*'],
            exclude: [
              'node_modules/**',
              'e2e/**',
              'src/**/*.server.ts',
              'src/**/*.test.{ts,tsx}',
              'src/routeTree.gen.ts',
              'src/vite-env.d.ts',
            ],
            extension: ['.js', '.jsx', '.ts', '.tsx'],
            requireEnv: true,
          })
        : undefined,
      sentryTanstackStart({
        org: 'maxstue',
        project: 'veo',
        authToken: env.SENTRY_AUTH_TOKEN,
        autoInstrumentMiddleware: false,
        tunnelRoute: true,
        // Upload only when CI provides the private token.
        sourcemaps: env.SENTRY_AUTH_TOKEN ? undefined : { disable: true },
        telemetry: false,
      }),
    ]),
  };
});

export default config;
