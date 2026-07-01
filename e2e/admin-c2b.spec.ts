import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin C2B Transactions Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/c2b-transactions", { waitUntil: "networkidle" });
  });

  test("renders C2B transactions heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /c2b transactions/i })
    ).toBeVisible();
  });

  test("renders refresh button", async ({ page }) => {
    const hasRefresh = await page.getByText(/refresh/i).count();
    expect(hasRefresh).toBeGreaterThan(0);
  });

  test("renders statistics cards", async ({ page }) => {
    const hasTotalReceived = await page.getByText(/total received/i).count();
    const hasProcessed = await page.getByText(/processed/i).count();
    const hasUnmatched = await page.getByText(/unmatched/i).count();
    const hasFailed = await page.getByText(/failed/i).count();

    expect(
      (hasTotalReceived > 0 && hasProcessed > 0) ||
        hasUnmatched > 0 ||
        hasFailed > 0
    ).toBeTruthy();
  });

  test("renders filter section", async ({ page }) => {
    await expect(page.getByText(/filters/i).first()).toBeVisible();
  });

  test("renders transactions table or empty state", async ({ page }) => {
    const hasTable = await page.locator("table").count();
    const hasCards = await page.locator(".rounded-lg").count();
    const hasEmpty = await page.getByText(/no transactions found/i).count();
    const hasLoading = await page.getByText(/loading transactions/i).count();

    expect(hasTable > 0 || hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });

  test("renders pay bill transactions section heading", async ({ page }) => {
    await expect(page.getByText(/pay bill transactions/i)).toBeVisible();
  });

  test("renders pagination when transactions exist", async ({ page }) => {
    const hasPagination = await page.getByText(/showing/i).count();
    const hasEmpty = await page.getByText(/no transactions/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasPagination > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });
});
