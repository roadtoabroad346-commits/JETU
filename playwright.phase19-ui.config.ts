import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui',
  testMatch: '*.spec.ts',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:3200',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  webServer: {
    command: 'node tests/ui/server.mjs',
    url: 'http://127.0.0.1:3200',
    reuseExistingServer: false,
  },
  reporter: 'list',
});
