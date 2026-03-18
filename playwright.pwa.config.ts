import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: /pwa-update-real-sw\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'NEXT_PUBLIC_BUILD_ID=e2e-sw-v1 npx next build --webpack && NEXT_PUBLIC_BUILD_ID=e2e-sw-v1 npx next start -p 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
