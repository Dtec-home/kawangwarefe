/**
 * Full-stack end-to-end tests: real Django backend + real Next.js app.
 *
 * Unlike playwright.config.ts (UI against mocked GraphQL), nothing here is
 * mocked in the browser. The backend runs with church_BE/settings_e2e: a fresh
 * SQLite database, fake Safaricom/SMS network underneath the real code, and
 * /e2e/ endpoints that play the phone's part (read SMS codes, approve the
 * M-Pesa prompt, pay a Pay Bill). Scenarios are Gherkin (playwright-bdd).
 *
 *   npm run test:e2e:full
 */

import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Ports are configurable so several worktrees can run the suite at once.
const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 8001);
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3101);
const BACKEND = `http://127.0.0.1:${BACKEND_PORT}`;
process.env.E2E_BACKEND_URL = BACKEND;

const testDir = defineBddConfig({
  features: "e2e-fullstack/features/**/*.feature",
  steps: ["e2e-fullstack/steps/**/*.ts", "e2e-fullstack/support/fixtures.ts"],
});

export default defineConfig({
  testDir,
  // One database for the whole run: scenarios reset it in their Background.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report-fullstack", open: "never" }]],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `E2E_BACKEND_PORT=${BACKEND_PORT} E2E_FRONTEND_PORT=${FRONTEND_PORT} bash ${process.env.E2E_BACKEND_DIR ?? "../church_BE"}/scripts/e2e_server.sh`,
      url: `${BACKEND}/e2e/health/`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
    {
      command: `npx next dev -p ${FRONTEND_PORT} --webpack`,
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: {
        NEXT_PUBLIC_GRAPHQL_URL: `${BACKEND}/graphql/`,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${FRONTEND_PORT}`,
      },
    },
  ],
});
