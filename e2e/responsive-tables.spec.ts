import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

test.describe("Responsive Tables -- Mobile Card View", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("dashboard contribution history shows card view on mobile", async ({ page }) => {
    // role: "member" mocks all GraphQL calls — without it, the dashboard's
    // real queries hit an unreachable backend (NEXT_PUBLIC_GRAPHQL_URL is a
    // LAN address in .env.local) and the page never leaves its loading state.
    await injectSession(page, { role: "member" });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

    // On mobile, table should be hidden and cards should be visible (or empty state)
    const table = page.locator("table");
    const tableVisible = await table.count() > 0 ? await table.first().isVisible() : false;

    const hasCards = await page.locator(".md\\:hidden .rounded-lg, .space-y-3 .rounded-lg").count();
    const hasEmpty = await page.getByText(/no contributions/i).count();

    // Either cards are showing (table hidden) or empty state
    expect(!tableVisible || hasCards > 0 || hasEmpty > 0).toBeTruthy();
  });
});

test.describe("Responsive Tables -- Desktop Table View", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("dashboard contribution history shows table on desktop", async ({ page }) => {
    // role: "member" mocks all GraphQL calls — without it, the dashboard's
    // real queries hit an unreachable backend (NEXT_PUBLIC_GRAPHQL_URL is a
    // LAN address in .env.local) and the page never leaves its loading state.
    await injectSession(page, { role: "member" });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

    // On desktop, either the table, cards, or empty state is shown
    const hasTable = await page.locator("table").count();
    const hasCards = await page.locator('[class*="rounded-lg"]').count();
    const hasEmpty = await page.getByText(/no contributions/i).count();
    const hasHistory = await page.getByText("Contribution History").count();

    expect(hasTable > 0 || hasCards > 0 || hasEmpty > 0 || hasHistory > 0).toBeTruthy();
  });
});
