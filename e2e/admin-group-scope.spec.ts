import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Admin groups and group scope", () => {
  test("staff can navigate to Groups management page", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    const groupsNav = page.getByRole("button", { name: /^groups$/i });
    await expect(groupsNav).toBeVisible();

    await groupsNav.click();
    await page.waitForURL(/\/admin\/groups/);
    await expect(page.getByRole("heading", { name: /^groups$/i })).toBeVisible();
  });

  test("group admin sees scoped contributions controls", async ({ page }) => {
    await injectSession(page, { role: "group-admin" });
    await page.goto("/admin/contributions", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: /contributions/i })).toBeVisible();
    await expect(page.getByLabel(/my group/i)).toBeVisible();

    const groupSelectTrigger = page.locator("#groupName");
    await groupSelectTrigger.click();
    await expect(page.getByRole("option", { name: "Youth" })).toBeVisible();

    // Group-admin should not see staff-only members navigation option.
    await expect(page.getByRole("button", { name: /^members$/i })).toHaveCount(0);
  });
});
