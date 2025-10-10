// @ts-check
import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/.playwright-output',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  webServer: process.env.CI
    ? {
        command: 'npm start',
        cwd: './',
        port: 3000,
        timeout: 120000,
        reuseExistingServer: !process.env.CI
      }
    : undefined
});
