import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
const executable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: './tests/journey',
  forbidOnly: Boolean(process.env.CI),
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3201',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath:
        executable && existsSync(executable) ? executable : undefined,
    },
  },
  webServer: {
    command: 'node tests/support/journey-server.mjs',
    url: 'http://127.0.0.1:3201/tests/journey/fixture.html',
    reuseExistingServer: false,
  },
});
