import { defineConfig, devices } from '@playwright/test';

// slowMo configuration:
// - Default: 0ms (fast headless runs)
// - Override with PLAYWRIGHT_SLOW_MO env var for custom speeds
// - Example (PowerShell): $env:PLAYWRIGHT_SLOW_MO=2000; npm run test:e2e (2 second delay)
// - For headed mode with pauses (PowerShell): $env:PLAYWRIGHT_SLOW_MO=800; npm run test:e2e:headed
const slowMo = parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo,
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
