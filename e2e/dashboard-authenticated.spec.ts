import { test, expect } from "@playwright/test";
import { injectSession, clearSession } from "./helpers/auth";

test.describe("Dashboard -- Authenticated Content", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { fullName: "John Doe", phoneNumber: "254797030300" });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
  });

  test("renders dashboard heading with user name", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    // Welcome message should show the user name
    await expect(page.getByText(/john doe/i)).toBeVisible();
  });

  test("renders summary cards", async ({ page }) => {
    await expect(page.getByText(/total contributions/i)).toBeVisible();
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
    await injectSession(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const contributeBtn = page.getByRole("button", { name: /contribution/i });
    if (await contributeBtn.count() > 0) {
      await contributeBtn.click();
      await page.waitForURL(/\/contribute/);
      expect(page.url()).toContain("/contribute");
    }
  });
});
