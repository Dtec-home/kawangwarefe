import { test, expect } from "@playwright/test";

test.describe("Announcements Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/announcements", { waitUntil: "networkidle" });
  });

  test("page loads with correct heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /announcements/i })).toBeVisible();
  });

  test("navigation bar is visible", async ({ page }) => {
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("back to home link is present", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /back to home|back/i })
    ).toBeVisible();
  });

  test("renders announcement cards or empty state", async ({ page }) => {
    // Either announcement content loads or a loading/empty state is shown
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmptyOrLoading = await page.getByText(/no announcements|loading/i).count();
    expect(hasCards > 0 || hasEmptyOrLoading > 0).toBeTruthy();
  });
});

test.describe("Devotionals Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/devotionals", { waitUntil: "networkidle" });
  });

  test("page loads with correct heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /devotional/i })).toBeVisible();
  });

  test("navigation bar is visible", async ({ page }) => {
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("back to home link is present", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /back to home|back/i })
    ).toBeVisible();
  });

  test("renders devotional cards or empty state", async ({ page }) => {
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmptyOrLoading = await page.getByText(/no devotional|loading/i).count();
    expect(hasCards > 0 || hasEmptyOrLoading > 0).toBeTruthy();
  });
});

test.describe("Events Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events", { waitUntil: "networkidle" });
  });

  test("page loads with correct heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /event/i })).toBeVisible();
  });

  test("navigation bar is visible", async ({ page }) => {
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("back to home link is present", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /back to home|back/i })
    ).toBeVisible();
  });

  test("renders event cards or empty state", async ({ page }) => {
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmptyOrLoading = await page.getByText(/no event|no upcoming|loading/i).count();
    // Also accept a spinner (Loader2) which shows during loading without text
    const hasSpinner = await page.locator('.animate-spin').count();
    expect(hasCards > 0 || hasEmptyOrLoading > 0 || hasSpinner > 0).toBeTruthy();
  });
});

test.describe("Sermons Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sermons", { waitUntil: "networkidle" });
  });

  test("page loads with correct heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sermon|watch|listen/i })).toBeVisible();
  });

  test("navigation bar is visible", async ({ page }) => {
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("back to home link is present", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /back to home|back/i })
    ).toBeVisible();
  });

  test("renders video content or empty state", async ({ page }) => {
    const hasVideos = await page.locator('[class*="card"], [class*="Card"], iframe').count();
    const hasEmptyOrLoading = await page.getByText(/no video|no sermon|loading/i).count();
    expect(hasVideos > 0 || hasEmptyOrLoading > 0).toBeTruthy();
  });
});
