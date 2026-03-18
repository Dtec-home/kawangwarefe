import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Category Admins Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
  });

  test("renders Category Admins heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /category admins/i })
    ).toBeVisible();
  });

  test("renders statistics cards", async ({ page }) => {
    const hasTotal = await page.getByText(/total categories/i).count();
    const hasAdmins = await page.getByText(/category admins/i).count();
    expect(hasTotal > 0 && hasAdmins > 0).toBeTruthy();
  });

  test("renders assign category admin form", async ({ page }) => {
    await expect(page.getByText(/assign category admin/i)).toBeVisible();
    await expect(page.getByPlaceholder(/search by name or phone/i)).toBeVisible();
  });

  test("renders member and category selectors", async ({ page }) => {
    const hasMemberSelect = await page.getByText(/select member/i).count();
    const hasCategorySelect = await page.getByText(/select category/i).count();
    expect(hasMemberSelect > 0 && hasCategorySelect > 0).toBeTruthy();
  });

  test("Assign Admin button is present and disabled when nothing selected", async ({ page }) => {
    const btn = page.getByRole("button", { name: /assign admin/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test("renders filter by category section", async ({ page }) => {
    await expect(page.getByText(/filter.*category/i)).toBeVisible();
  });

  test("renders current category admins section", async ({ page }) => {
    await expect(page.getByText(/current category admins/i)).toBeVisible();
  });

  test("shows empty state or admin list", async ({ page }) => {
    const hasEmpty = await page.getByText(/no category admins assigned yet/i).count();
    const hasList = await page.locator("table, .border.rounded-lg").count();
    const hasLoading = await page.getByText(/loading/i).count();
    expect(hasEmpty > 0 || hasList > 0 || hasLoading > 0).toBeTruthy();
  });

  test("non-staff session is redirected away from page", async ({ page }) => {
    await injectSession(page, { role: "member" });
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/(login|dashboard)/);
  });
});
