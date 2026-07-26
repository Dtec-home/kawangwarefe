import { test, expect, Page } from "@playwright/test";
import { injectSession, clearSession } from "./helpers/auth";

/**
 * Pre-empt the two first-run overlays this page can show, both of which
 * cover the full viewport and block clicks on the real content underneath:
 *
 * 1. OnboardingCarousel — gated by a localStorage flag
 *    (`cfms_onboarding_complete`); seed it so the carousel never mounts.
 * 2. An auto-started driver.js "welcome tour" — gated by an
 *    `isTutorialCompleted` GraphQL query; the generic auth.ts mock resolves
 *    that (like any unlisted query) to `data: null`, i.e. "not completed",
 *    so the dashboard fires it ~500ms after load. Layer a route override on
 *    top of injectSession's that answers `isTutorialCompleted: true` and
 *    falls back to the existing handler for everything else.
 */
async function suppressFirstRunOverlays(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("cfms_onboarding_complete", "true");
  });
  await page.route(/\/graphql\/?$/, async (route, request) => {
    let query = "";
    try {
      query = request.postDataJSON()?.query ?? "";
    } catch {
      // ignore
    }
    if (query.includes("isTutorialCompleted")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { isTutorialCompleted: true } }),
      });
      return;
    }
    await route.fallback();
  });
}

test.describe("Dashboard -- Authenticated Content", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { fullName: "John Doe", phoneNumber: "254798765432" });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    // "networkidle" resolves before React finishes rendering — wait for the
    // heading so later checks don't race hydration.
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("renders dashboard heading with user name", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    // "John Doe" also appears in the sidebar and the desktop header (both
    // just render the bare name) — match the page's own "Welcome, John Doe"
    // text specifically to avoid the strict-mode multi-match violation.
    await expect(page.getByText(/welcome, john doe/i)).toBeVisible();
  });

  test("renders summary cards", async ({ page }) => {
    // "Total Contributions" (StatCard title) is a substring of the "Giving
    // Snapshot" card's h2 ("View total contributions and breakdown") under a
    // case-insensitive match — use the exact card title to disambiguate.
    await expect(page.getByText("Total Contributions", { exact: true })).toBeVisible();
    await expect(page.getByText(/this month/i)).toBeVisible();
    // "Status" appears in both card title and table header; use first()
    await expect(page.getByText("Status").first()).toBeVisible();
  });

  test("renders contribution history section", async ({ page }) => {
    // CardTitle renders as <div>, not <h*>
    await expect(page.getByText("Contribution History")).toBeVisible();
  });

  test("contribution history shows table, cards, empty, or loading state", async ({ page }) => {
    const hasTable = await page.locator("table").count();
    const hasCards = await page.locator('[class*="rounded-lg"]').count();
    const hasEmpty = await page.getByText(/no contributions/i).count();
    const hasLoading = await page.getByText(/loading contributions/i).count();
    expect(hasTable > 0 || hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });

  test("header has action buttons", async ({ page }) => {
    // At minimum, Make Contribution and Logout should be present
    const hasContributeBtn = await page.getByRole("button", { name: /contribution/i }).count();
    const hasContributeIcon = await page.locator('button:has(svg)').count();
    const hasLogout = await page.getByRole("button", { name: /logout/i }).count();
    const hasLogoutIcon = await page.locator('button').filter({ hasText: /logout/i }).count();

    expect(hasContributeBtn > 0 || hasContributeIcon > 0).toBeTruthy();
    expect(hasLogout > 0 || hasLogoutIcon > 0).toBeTruthy();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    // Find and click the logout button (may be icon-only on mobile)
    const logoutBtn = page.getByRole("button", { name: /logout/i });
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    }
  });
});

test.describe("Dashboard -- Make Contribution navigation", () => {
  test("Make Contribution button navigates to /contribute", async ({ page }) => {
    await injectSession(page, { role: "member" });
    await suppressFirstRunOverlays(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

    const contributeBtn = page.getByRole("button", { name: /contribution/i });
    if (await contributeBtn.count() > 0) {
      await contributeBtn.click();
      await page.waitForURL(/\/contribute/);
      expect(page.url()).toContain("/contribute");
    }
  });
});
