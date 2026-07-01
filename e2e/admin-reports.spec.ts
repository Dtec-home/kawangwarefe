import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/reports", { waitUntil: "networkidle" });
  });

  test("renders reports heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Reports", exact: true })
    ).toBeVisible();
  });

  test("renders report type selector", async ({ page }) => {
    const hasReportType = await page.getByText(/report type|daily|weekly|monthly|custom/i).count();
    expect(hasReportType).toBeGreaterThan(0);
  });

  test("renders format selector", async ({ page }) => {
    const hasFormat = await page.getByText(/format|excel|pdf|csv/i).count();
    expect(hasFormat).toBeGreaterThan(0);
  });

  test("renders generate report button", async ({ page }) => {
    const hasGenerateBtn = await page.getByRole("button", { name: /generate|download/i }).count();
    expect(hasGenerateBtn).toBeGreaterThan(0);
  });

  test("renders quick report cards", async ({ page }) => {
    const hasQuickReports = await page.getByText(/quick report|daily|weekly|monthly/i).count();
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();

    expect(hasQuickReports > 0 || hasCards > 0).toBeTruthy();
  });
});
