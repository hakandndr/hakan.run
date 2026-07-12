import { defineConfig, devices } from '@playwright/test';

// hakan.run — end-to-end test config.
// Tests run against a production build served locally (same artifact that ships).
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium',      use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],

  // Build the app and serve it before the tests start.
  webServer: {
    command: 'npm run build --prefix apps/web && npm run start --prefix apps/web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
