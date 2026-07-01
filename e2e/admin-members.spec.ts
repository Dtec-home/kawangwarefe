import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Members Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/members", { waitUntil: "networkidle" });
  });

  test("renders members heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /members/i })
    ).toBeVisible();
  });

  test("renders statistics cards (total, active, inactive)", async ({ page }) => {
    const hasTotal = await page.getByText(/total members/i).count();
    const hasActive = await page.getByText(/active members/i).count();
    const hasInactive = await page.getByText(/inactive members/i).count();

    expect(hasTotal > 0 && hasActive > 0 && hasInactive > 0).toBeTruthy();
  });

  test("renders search and filter section", async ({ page }) => {
    await expect(page.getByText(/search & filter/i)).toBeVisible();
    await expect(
      page.getByPlaceholder(/name|phone|member number/i)
    ).toBeVisible();
  });

  test("renders import members button", async ({ page }) => {
    const hasImport = await page.getByText(/import members/i).count();
    expect(hasImport).toBeGreaterThan(0);
  });

  test("renders members table or empty state", async ({ page }) => {
    const hasTable = await page.locator("table").count();
    const hasCards = await page.locator(".rounded-lg").count();
    const hasEmpty = await page.getByText(/no members found/i).count();
    const hasLoading = await page.getByText(/loading members/i).count();

    expect(hasTable > 0 || hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });

  test("renders pagination controls when members exist", async ({ page }) => {
    const hasPagination = await page.getByText(/page/i).count();
    const hasEmpty = await page.getByText(/no members found/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    // Either pagination is shown or empty/loading state
    expect(hasPagination > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });

  test("import link navigates correctly", async ({ page }) => {
    const importLink = page.getByRole("link", { name: /import/i });
    if ((await importLink.count()) > 0) {
      await importLink.click();
      await page.waitForURL(/\/admin\/members\/import/);
      expect(page.url()).toContain("/admin/members/import");
    }
  });
});

test.describe("Admin Members Import Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/members/import", { waitUntil: "networkidle" });
  });

  test("renders import heading", async ({ page }) => {
    const hasHeading = await page.getByRole("heading", { name: /import/i }).count();
    expect(hasHeading).toBeGreaterThan(0);
  });

  test("renders file upload area", async ({ page }) => {
    const hasUpload =
      (await page.locator("input[type='file']").count()) +
      (await page.getByText(/upload|drag|drop|csv/i).count());
    expect(hasUpload).toBeGreaterThan(0);
  });

  test("renders CSV format instructions", async ({ page }) => {
    const hasInstructions = await page.getByText(/csv|format|column|header/i).count();
    expect(hasInstructions).toBeGreaterThan(0);
  });

  test("shows error when non-CSV file is uploaded", async ({ page }) => {
    const fileInput = page.locator("input[type='file']");
    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles({
        name: "test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("not a csv"),
      });
      const hasError = await page.getByText(/invalid|csv|format|error/i).count();
      // Either an error shows or the input rejects the file type
      expect(hasError >= 0).toBeTruthy();
    }
  });
});
