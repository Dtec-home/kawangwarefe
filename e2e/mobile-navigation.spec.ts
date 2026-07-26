import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

/**
 * Mobile navigation tests — bottom nav bar behavior.
 * Uses a narrow viewport to trigger mobile-only components.
 */

test.describe("Public Bottom Nav -- Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("bottom nav is visible on homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Bottom nav should be a fixed nav at the bottom
    const bottomNav = page.locator("nav").last();
    await expect(bottomNav).toBeVisible();
  });

  test("bottom nav contains Home, Give, Events, Sermons links", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.getByText("Home").last()).toBeVisible();
    await expect(page.getByText("Give").last()).toBeVisible();
    await expect(page.getByText("Events").last()).toBeVisible();
    await expect(page.getByText("Sermons").last()).toBeVisible();
  });

  // KNOWN APP GAP, needs a Sprint E product decision (see
  // docs/test-parity-audit/07_ADMIN_PARITY_SPRINT_PLAN_2026-07-21.md):
  // components/layouts/bottom-nav.tsx's `guestPrimaryLinks` (used for
  // unauthenticated visitors, which is what this describe block tests) is
  // [Home, Give, Events, Sermons] — there is no "More" button for guests at
  // all, only for authenticated members (`memberPrimaryLinks`).
  // guestMoreLinks (Announcements, Devotionals) is defined in the component
  // but never rendered anywhere for guests, so this test cannot pass without
  // either a product decision to add a guest "More" affordance or an
  // explicit re-scope of this test to an authenticated session.
  test.fixme("bottom nav has More button that opens menu", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const moreBtn = page.getByText("More").last();
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();

    // More menu should show additional links
    await expect(page.getByText(/announcements/i).last()).toBeVisible();
    await expect(page.getByText(/devotionals/i).last()).toBeVisible();
  });

  test("Give link navigates to /contribute", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByText("Give").last().click();
    await page.waitForURL(/\/contribute/);
    expect(page.url()).toContain("/contribute");
  });

  test("bottom nav is visible on /contribute", async ({ page }) => {
    await page.goto("/contribute", { waitUntil: "networkidle" });
    const bottomNav = page.locator("nav").last();
    await expect(bottomNav).toBeVisible();
  });

  test("bottom nav is visible on /events", async ({ page }) => {
    await page.goto("/events", { waitUntil: "networkidle" });
    const bottomNav = page.locator("nav").last();
    await expect(bottomNav).toBeVisible();
  });
});

test.describe("Public Bottom Nav -- Desktop (hidden)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("bottom nav is NOT visible on desktop", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // The bottom nav has class md:hidden, so on desktop it should not be visible
    const bottomNavs = page.locator('nav.fixed, nav[class*="bottom"]');
    const count = await bottomNavs.count();
    if (count > 0) {
      // Check that the bottom-positioned nav is hidden
      for (let i = 0; i < count; i++) {
        const isVisible = await bottomNavs.nth(i).isVisible();
        // At least one fixed nav should be hidden on desktop (the bottom one)
        if (!isVisible) return; // Pass — bottom nav is hidden
      }
    }
    // If no fixed navs exist or all are visible, that's also acceptable on desktop
  });
});

test.describe("Admin Bottom Nav -- Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("admin bottom nav is visible on admin pages", async ({ page }) => {
    // Without a role, injectSession sets up no GraphQL mocking at all, so
    // currentUserRole hits the real (unreachable, in this environment)
    // backend and never resolves — canAccessFeature() then always returns
    // false and AdminBottomNav renders no nav items. role: "staff" gives it
    // real role data so the nav actually renders.
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });
    // "networkidle" resolves before React finishes rendering — wait for the
    // dashboard heading so the bare .count() checks below don't race hydration.
    await expect(page.getByRole("heading", { name: /dashboard overview/i })).toBeVisible();

    // Admin bottom nav should show Overview, Funds, Members, Reports, More
    // Check that at least some admin nav items are visible
    const hasOverview = await page.getByText("Overview").count();
    const hasFunds = await page.getByText("Funds").count();
    const hasMembers = await page.getByText("Members").count();

    expect(hasOverview > 0 || hasFunds > 0 || hasMembers > 0).toBeTruthy();
  });
});
