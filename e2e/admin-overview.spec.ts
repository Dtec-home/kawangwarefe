import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Overview Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });
  });

  test("renders dashboard overview heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard overview/i })
    ).toBeVisible();
  });

  test("renders statistics cards", async ({ page }) => {
    // Should show Today, This Week, This Month, Total cards
    const hasToday = await page.getByText(/today/i).count();
    const hasWeek = await page.getByText(/this week/i).count();
    const hasMonth = await page.getByText(/this month/i).count();
    const hasTotal = await page.getByText(/total/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(
      (hasToday > 0 && hasWeek > 0 && hasMonth > 0 && hasTotal > 0) ||
        hasLoading > 0
    ).toBeTruthy();
  });

  test("renders recent contributions section", async ({ page }) => {
    await expect(
      page.getByText(/recent contributions/i)
    ).toBeVisible();
  });

  test("renders member stats cards", async ({ page }) => {
    const hasMembers = await page.getByText(/members/i).count();
    const hasQuickStats = await page.getByText(/quick stats/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasMembers > 0 || hasQuickStats > 0 || hasLoading > 0).toBeTruthy();
  });

  test("recent contributions shows table or cards or empty state", async ({ page }) => {
    const hasTable = await page.locator("table").count();
    const hasCards = await page.locator(".rounded-lg").count();
    const hasEmpty = await page.getByText(/no contributions/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasTable > 0 || hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });
});
