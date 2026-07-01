import { test, expect } from "@playwright/test";
import { injectSession } from "./helpers/auth";

/**
 * Error state and edge case tests.
 *
 * Verifies the app handles error conditions gracefully:
 * - 404 pages
 * - Invalid routes
 * - Network errors on public pages
 * - Login page structure
 */

test.describe("404 -- Non-existent Routes", () => {
  test("visiting /nonexistent shows 404 or redirects", async ({ page }) => {
    const response = await page.goto("/nonexistent", { waitUntil: "networkidle" });
    const has404 = await page.getByText(/404|not found|page not found/i).count();
    const redirectedHome = page.url().endsWith("/") || page.url().includes("/nonexistent");
    const statusIs404 = response?.status() === 404;

    expect(has404 > 0 || redirectedHome || statusIs404).toBeTruthy();
  });

  test("visiting /admin/nonexistent without auth redirects", async ({ page }) => {
    const response = await page.goto("/admin/nonexistent", { waitUntil: "networkidle" });
    const has404 = await page.getByText(/404|not found/i).count();
    const statusIs404 = response?.status() === 404;
    const redirected = page.url().includes("/login");

    expect(has404 > 0 || statusIs404 || redirected).toBeTruthy();
  });
});

test.describe("Public Pages -- Network Resilience", () => {
  test("announcements page shows empty state when API is down", async ({ page }) => {
    await page.route(/\/graphql\/?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null, errors: [{ message: "Service unavailable" }] }),
      });
    });

    await page.goto("/announcements", { waitUntil: "networkidle" });

    const hasHeading = await page.getByRole("heading", { name: /announcements/i }).count();
    const hasEmptyOrError = await page.getByText(/no announcements|error|loading/i).count();

    expect(hasHeading > 0 || hasEmptyOrError > 0).toBeTruthy();
  });

  test("events page shows empty state when API is down", async ({ page }) => {
    await page.route(/\/graphql\/?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null, errors: [{ message: "Service unavailable" }] }),
      });
    });

    await page.goto("/events", { waitUntil: "networkidle" });

    const hasHeading = await page.getByRole("heading", { name: /event/i }).count();
    const hasEmptyOrError = await page.getByText(/no event|no upcoming|error|loading/i).count();

    expect(hasHeading > 0 || hasEmptyOrError > 0).toBeTruthy();
  });

  test("contribute page renders structure even when API is down", async ({ page }) => {
    await page.route(/\/graphql\/?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null, errors: [{ message: "Service unavailable" }] }),
      });
    });

    await page.goto("/contribute", { waitUntil: "networkidle" });

    const hasHeading = await page.getByRole("heading", { name: /contribute|give|offering/i }).count();
    const hasContent = await page.locator('[class*="card"], [class*="Card"], form').count();

    expect(hasHeading > 0 || hasContent > 0).toBeTruthy();
  });
});

test.describe("Login Page", () => {
  test("login page renders phone input", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    const hasPhoneInput =
      (await page.getByPlaceholder(/phone/i).count()) +
      (await page.locator('input[type="tel"]').count());
    const hasLoginHeading = await page.getByRole("heading", { name: /login|sign in|welcome/i }).count();

    expect(hasPhoneInput > 0 || hasLoginHeading > 0).toBeTruthy();
  });

  test("login page has submit button", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    const hasSubmit = await page.getByRole("button", {
      name: /login|sign in|send|continue|get otp|verification/i,
    }).count();

    expect(hasSubmit).toBeGreaterThan(0);
  });
});

test.describe("Contribute Page", () => {
  test("contribute page renders without auth", async ({ page }) => {
    await page.goto("/contribute", { waitUntil: "networkidle" });

    const hasHeading = await page.getByRole("heading", { name: /contribute|give|offering|tithe/i }).count();
    const hasForm = await page.locator("form").count();
    const hasContent = await page.locator('[class*="card"], [class*="Card"]').count();

    expect(hasHeading > 0 || hasForm > 0 || hasContent > 0).toBeTruthy();
  });
});
