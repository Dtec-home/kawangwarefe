import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin Category Admins Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
  });

  test("renders category admins heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /category admins/i })
    ).toBeVisible();
  });

  test("renders statistics cards", async ({ page }) => {
    const hasTotalCategories = await page.getByText(/total categories/i).count();
    const hasCategoryAdmins = await page.getByText(/category admins/i).count();
    const hasCategoriesWithAdmins = await page.getByText(/categories with admins/i).count();

    expect(
      hasTotalCategories > 0 && hasCategoryAdmins > 0 && hasCategoriesWithAdmins > 0
    ).toBeTruthy();
  });

  test("renders assign category admin form", async ({ page }) => {
    await expect(page.getByText(/assign category admin/i)).toBeVisible();
    await expect(page.getByText(/search member/i)).toBeVisible();
    await expect(page.getByText(/select category/i)).toBeVisible();
  });

  test("renders filter section", async ({ page }) => {
    await expect(page.getByText(/filter category admins/i)).toBeVisible();
    await expect(page.getByText(/filter by category/i)).toBeVisible();
  });

  test("renders current category admins list or empty state", async ({ page }) => {
    const hasAdminsList = await page.getByText(/current category admins/i).count();
    const hasEmpty = await page.getByText(/no category admins assigned/i).count();
    const hasLoading = await page.getByText(/loading/i).count();

    expect(hasAdminsList > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });

  test("assign admin button is present", async ({ page }) => {
    const hasAssignBtn = await page.getByRole("button", { name: /assign admin/i }).count();
    expect(hasAssignBtn).toBeGreaterThan(0);
  });
});
