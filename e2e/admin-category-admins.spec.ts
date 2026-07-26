import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

// Canonical spec for /admin/category-admins. Consolidated from two stale,
// duplicate spec files (admin-categories.spec.ts + admin-category-admins.spec.ts)
// that both predated the "Category Admins" → "Department Admins" copy rename
// (see app/(dashboard)/admin/category-admins/page.tsx). This file keeps the
// more complete test set and updates all assertions to the current copy.
test.describe("Admin Department Admins Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
    // "networkidle" resolves before React finishes hydrating/rendering the
    // admin shell + this page's queries — waiting for the heading here
    // guarantees the DOM is settled before tests fire bare .count() checks
    // (which, unlike expect(...).toBeVisible(), don't auto-retry).
    await expect(
      page.getByRole("heading", { name: "Department Admins", exact: true })
    ).toBeVisible();
  });

  test("renders Department Admins heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Department Admins", exact: true })
    ).toBeVisible();
  });

  test("renders statistics cards", async ({ page }) => {
    const hasTotal = await page.getByText(/total departments/i).count();
    const hasAdmins = await page.getByText(/department admins/i).count();
    const hasWithAdmins = await page.getByText(/departments with admins/i).count();
    expect(hasTotal > 0 && hasAdmins > 0 && hasWithAdmins > 0).toBeTruthy();
  });

  test("renders assign department admin form", async ({ page }) => {
    await expect(page.getByText(/assign department admin/i)).toBeVisible();
    await expect(page.getByPlaceholder(/search by name or phone/i)).toBeVisible();
  });

  test("renders member and department selectors", async ({ page }) => {
    const hasMemberSelect = await page.getByText(/select member/i).count();
    const hasDepartmentSelect = await page.getByText(/select department/i).count();
    expect(hasMemberSelect > 0 && hasDepartmentSelect > 0).toBeTruthy();
  });

  test("Assign Admin button is present and disabled when nothing selected", async ({ page }) => {
    const btn = page.getByRole("button", { name: /assign admin/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test("renders filter by department section", async ({ page }) => {
    await expect(page.getByText(/filter department admins/i)).toBeVisible();
    await expect(page.getByText(/filter by department/i)).toBeVisible();
  });

  test("renders current department admins section", async ({ page }) => {
    await expect(page.getByText(/current department admins/i)).toBeVisible();
  });

  test("shows empty state or admin list", async ({ page }) => {
    // The heading renders immediately (PageHeader is static), but this card's
    // content depends on the categoryAdmins query, which can still be in its
    // loading/skeleton state right after the heading appears. Poll instead
    // of a one-shot count so a slow-resolving query doesn't flake the test.
    await expect(async () => {
      const hasEmpty = await page.getByText(/no department admins yet/i).count();
      const hasList = await page.locator("table, .border.rounded-lg").count();
      const hasLoading = await page.getByText(/loading/i).count();
      expect(hasEmpty > 0 || hasList > 0 || hasLoading > 0).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test("non-staff session is redirected away from page", async ({ page }) => {
    await injectSession(page, { role: "member" });
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
    // The redirect fires from a useEffect once the role query resolves —
    // "networkidle" doesn't wait for that, so check the URL synchronously
    // races the redirect. Wait for the actual navigation instead.
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 8000 });
    expect(page.url()).toMatch(/\/(login|dashboard)/);
  });
});
