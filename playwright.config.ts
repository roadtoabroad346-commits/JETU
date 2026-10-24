import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// A system Chromium may be selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
// Validate that it exists so a typo or a WSL-style path fails with a clear
// diagnostic instead of a cryptic launch error.
const configuredExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
if (configuredExecutable && !existsSync(configuredExecutable)) {
  console.warn(
    `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set but the file does not exist: ${configuredExecutable}. Falling back to the Playwright-managed Chromium.`,
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: configuredExecutable,
    },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Always build a fresh production bundle so browser tests never exercise
    // a stale .next output.
    command: 'npm run build && npm run start -- --port 3100',
    url: 'http://127.0.0.1:3100/api/health',
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
