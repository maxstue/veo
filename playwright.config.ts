import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    timeout: process.env.CI ? 30_000 : 5_000,
  },
  use: {
    actionTimeout: process.env.CI ? 30_000 : 15_000,
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'vp run test:e2e:server',
    env: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'playwright-development-only-value-000000',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'playwright-google-client-id',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? 'playwright-google-client-secret',
      MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ?? 'playwright-microsoft-client-id',
      MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ?? 'playwright-microsoft-client-secret',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 'playwright-resend-api-key',
      SENTRY_DSN: process.env.SENTRY_DSN ?? 'https://playwright@example.invalid/1',
      VITE_COVERAGE: 'true',
    },
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true',
    timeout: 120_000,
    url: 'http://localhost:5173',
  },
});
