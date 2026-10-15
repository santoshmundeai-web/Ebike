import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * End-to-end tests and user-guide screenshots. Runs against the local database with the demo
 * seed (`pnpm db:seed`). Phone viewport first (CLAUDE.md section 6).
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    // Better Auth only accepts requests from its own origin.
    env: { BETTER_AUTH_URL: `http://localhost:${PORT}` },
    timeout: 120_000,
  },
});
