import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/reports", { waitUntil: "networkidle" });
    // "networkidle" resolves before React finishes rendering — wait for the
    // heading so later checks don't race hydration.
    await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  });

  test("renders reports heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Reports", exact: true })
    ).toBeVisible();
  });

  // The report-type/format/generate/quick-report controls used to live on
  // the page directly. The Reports page was since redesigned into four
  // modes (Overview / Explore Data / Member Progress / Exports); the classic
  // "generate & download a report" form now lives under the "Exports" mode,
  // which only staff see and which isn't selected by default (defaults to
  // "Overview"). Each test below switches to it first.
  test("renders report type selector", async ({ page }) => {
    await page.getByRole("button", { name: "Exports", exact: true }).click();
    const hasReportType = await page.getByText(/report type|daily|weekly|monthly|custom/i).count();
    expect(hasReportType).toBeGreaterThan(0);
  });

  test("renders format selector", async ({ page }) => {
    await page.getByRole("button", { name: "Exports", exact: true }).click();
    const hasFormat = await page.getByText(/format|excel|pdf|csv/i).count();
    expect(hasFormat).toBeGreaterThan(0);
  });

  test("renders generate report button", async ({ page }) => {
    await page.getByRole("button", { name: "Exports", exact: true }).click();
    const hasGenerateBtn = await page.getByRole("button", { name: /generate|download/i }).count();
    expect(hasGenerateBtn).toBeGreaterThan(0);
  });

  test("renders quick report cards", async ({ page }) => {
    await page.getByRole("button", { name: "Exports", exact: true }).click();
    const hasQuickReports = await page.getByText(/quick report|daily|weekly|monthly/i).count();
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();

    expect(hasQuickReports > 0 || hasCards > 0).toBeTruthy();
  });
});
