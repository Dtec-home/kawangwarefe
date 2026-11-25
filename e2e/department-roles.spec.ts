/**
 * Department roles (DEPARTMENT_REPORTS/05_DEPARTMENT_ROLES_PLAN.md), mocked GraphQL.
 *
 * R2 a department that is not in giving (Elders) is not offered on the give page.
 * R3 the admin sets a leader profile while assigning a department leader, and edits it.
 * R4 the clerk lands on Department Reports, sees only that menu, opens the
 *    tracker and reads a report, but has no Send back / Approve.
 */

import { test, expect, type Locator, type Page } from "@playwright/test";
import { fakeClerk, fakeDeptAdmins, fakeGivePage } from "./helpers/department-roles";

// The dev server compiles each route on first hit; give cold starts room.
test.describe.configure({ timeout: 90_000 });

/** Open a Radix select (retrying until hydration wires it up) and pick an option. */
async function openSelect(page: Page, trigger: Locator) {
  await expect(async () => {
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

test.describe("Giving (R2)", () => {
  test("Elders is not offered on the give page", async ({ page }) => {
    const state = await fakeGivePage(page);
    await page.goto("/contribute");
    const picker = page.locator("#category-0");
    await expect(picker).toBeVisible({ timeout: 20_000 });
    await openSelect(page, picker);
    await expect(page.getByRole("option", { name: "Tithe" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Offering" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Elders" })).toHaveCount(0);
    expect(state.categoryQueries.length).toBeGreaterThan(0);
    for (const q of state.categoryQueries) expect(q).toMatch(/forGiving:\s*true/);
  });
});

test.describe("Clerk (R4)", () => {
  test("lands on Department Reports after login", async ({ page }) => {
    await fakeClerk(page);
    await page.goto("/post-login");
    await expect(page).toHaveURL(/\/admin\/department-reports$/, { timeout: 30_000 });
  });

  test("sees only Department Reports, opens the tracker and reads without reviewing", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await fakeClerk(page);
    await page.goto("/admin/department-reports");

    const tracker = page.getByRole("link", { name: "Open the tracker" });
    await expect(tracker).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Clerk", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Department Reports" }).first()).toBeVisible();
    for (const name of ["Overview", "Contributions", "Members", "Expenses", "Receipts", "Dept. Admins"]) {
      await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
    await expect(page.getByRole("link", { name: "Reporting periods" })).toHaveCount(0);

    await tracker.click();
    await expect(page).toHaveURL(/\/admin\/department-reports\/period\/1$/, { timeout: 30_000 });
    const row = page.getByTestId("dept-report-tracker-row").filter({ hasText: "Building Fund" });
    await expect(row).toBeVisible({ timeout: 20_000 });

    await page.goto("/admin/department-reports/5");
    await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Download Word" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send back" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(page.getByTestId("dept-report-live-financial")).toHaveCount(0);
  });

  test("is sent back to Department Reports from a staff page", async ({ page }) => {
    await fakeClerk(page);
    // /admin/members is behind requiredAccess="staff".
    await page.goto("/admin/members");
    await expect(page).toHaveURL(/\/admin\/department-reports$/, { timeout: 30_000 });
  });

  for (const moneyPage of ["/admin/transfers", "/admin/contributions"]) {
    test(`is sent back to Department Reports from ${moneyPage}`, async ({ page }) => {
      await fakeClerk(page);
      await page.goto(moneyPage);
      await expect(page).toHaveURL(/\/admin\/department-reports$/, { timeout: 30_000 });
    });
  }
});

test.describe("Leader profile (R3)", () => {
  test("the admin assigns a leader with a profile, then edits it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const state = await fakeDeptAdmins(page);
    await page.goto("/admin/category-admins");
    await expect(page.getByRole("heading", { name: "Department Admins", exact: true })).toBeVisible({ timeout: 20_000 });

    await openSelect(page, page.locator("#member-select"));
    await page.getByRole("option", { name: /Mary Atieno/ }).click();
    await openSelect(page, page.locator("#category-select"));
    await page.getByRole("option", { name: "Elders" }).click();

    const profile = page.getByRole("group", { name: "Leader profile" });
    await profile.getByLabel("Title").fill("Head Elder");
    await profile.getByLabel("Bio").fill("Leads the elders.");
    await expect(profile.getByRole("switch", { name: "Show on the website" })).toBeChecked();
    await page.getByRole("button", { name: /Assign Admin/ }).click();

    await expect.poll(() => state.assignments.length).toBe(1);
    expect(state.calls.find((c) => c.op === "AssignCategoryAdmin")?.variables).toEqual({
      memberId: "m3",
      categoryId: "9",
      profile: { title: "Head Elder", bio: "Leads the elders.", photoUrl: "", showOnWebsite: true, displayOrder: 0 },
    });

    const row = page.locator('tr[data-admin-id="ca1"]');
    await expect(row.getByTestId("leader-profile-status")).toContainText("Head Elder", { timeout: 20_000 });
    await expect(row.getByTestId("leader-profile-status")).toContainText("On the website");

    await row.getByRole("button", { name: "Edit profile for Mary Atieno" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Title")).toHaveValue("Head Elder");
    await dialog.getByLabel("Title").fill("Senior Elder");
    await dialog.getByRole("switch", { name: "Show on the website" }).click();
    await dialog.getByRole("button", { name: "Save profile" }).click();
    await expect(dialog).toBeHidden();

    expect(state.calls.find((c) => c.op === "UpdateDepartmentLeaderProfile")?.variables).toEqual({
      categoryAdminId: "ca1",
      profile: { title: "Senior Elder", bio: "Leads the elders.", photoUrl: "", showOnWebsite: false, displayOrder: 0 },
    });
    await expect(row.getByTestId("leader-profile-status")).toContainText("Senior Elder");
    await expect(row.getByTestId("leader-profile-status")).toContainText("Not on the website");
  });
});
