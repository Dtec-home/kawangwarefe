import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Announcements Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/announcements", { waitUntil: "networkidle" });
  });

  test("renders announcements heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /announcements/i })
    ).toBeVisible();
  });

  test("renders new announcement button", async ({ page }) => {
    const hasNewBtn = await page.getByText(/new announcement/i).count();
    expect(hasNewBtn).toBeGreaterThan(0);
  });

  test("renders statistics cards", async ({ page }) => {
    const hasTotal = await page.getByText(/total/i).count();
    const hasActive = await page.getByText(/active/i).count();
    const hasHighPriority = await page.getByText(/high priority/i).count();

    expect(hasTotal > 0 && hasActive > 0 && hasHighPriority > 0).toBeTruthy();
  });

  test("renders filter section", async ({ page }) => {
    await expect(page.getByText(/filters/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/search announcements/i)).toBeVisible();
  });

  test("renders announcements list or empty state", async ({ page }) => {
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmpty = await page.getByText(/no announcements found/i).count();
    const hasLoading = await page.getByText(/loading announcements/i).count();

    expect(hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });
});

test.describe("Admin Devotionals Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/devotionals", { waitUntil: "networkidle" });
  });

  test("renders devotionals heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /devotional/i })
    ).toBeVisible();
  });

  test("renders new devotional button", async ({ page }) => {
    const hasNewBtn = await page.getByText(/new devotional/i).count();
    expect(hasNewBtn).toBeGreaterThan(0);
  });

  test("renders devotionals list or empty state", async ({ page }) => {
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmpty = await page.getByText(/no devotional/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });
});

test.describe("Admin Events Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/events", { waitUntil: "networkidle" });
  });

  test("renders events heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /event/i })
    ).toBeVisible();
  });

  test("renders new event button", async ({ page }) => {
    const hasNewBtn = await page.getByText(/new event/i).count();
    expect(hasNewBtn).toBeGreaterThan(0);
  });

  test("renders events list or empty state", async ({ page }) => {
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmpty = await page.getByText(/no event/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });
});

test.describe("Admin YouTube Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/youtube", { waitUntil: "networkidle" });
  });

  test("renders youtube/sermons heading", async ({ page }) => {
    const hasYouTube = await page.getByRole("heading", { name: /youtube|sermon|video/i }).count();
    expect(hasYouTube).toBeGreaterThan(0);
  });

  test("renders sync button", async ({ page }) => {
    const hasSyncBtn = await page.getByText(/sync/i).count();
    expect(hasSyncBtn).toBeGreaterThan(0);
  });

  test("renders videos list or empty state", async ({ page }) => {
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmpty = await page.getByText(/no video|no sermon/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasCards > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });
});
