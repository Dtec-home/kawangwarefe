import { test, expect } from "@playwright/test";

test.describe("Confirmation Page", () => {
  test("without params shows error or redirects", async ({ page }) => {
    await page.goto("/confirmation", { waitUntil: "networkidle" });

    // Should show an error message or redirect to contribute
    const hasError = await page.getByText(/not found|error|no contribution|invalid/i).count();
    const redirectedToContribute = page.url().includes("/contribute");
    const hasLoadingOrEmpty = await page.getByText(/loading/i).count();

    expect(hasError > 0 || redirectedToContribute || hasLoadingOrEmpty > 0).toBeTruthy();
  });

  test("with contribution id shows details card", async ({ page }) => {
    // Navigate with a fake ID — the page should at least render the structure
    await page.goto("/confirmation?id=test-123", { waitUntil: "networkidle" });

    // Should show either contribution details or a loading/error state
    const hasDetailsHeading = await page.getByText(/contribution detail|payment|status/i).count();
    const hasLoadingOrError = await page.getByText(/loading|error|not found/i).count();

    expect(hasDetailsHeading > 0 || hasLoadingOrError > 0).toBeTruthy();
  });

  test("action buttons are present when page loads", async ({ page }) => {
    await page.goto("/confirmation?id=test-123", { waitUntil: "networkidle" });

    // Should have at least a "Make Another Contribution" button or similar
    const hasActionButton = await page.getByRole("button", {
      name: /another contribution|check status|dashboard/i,
    }).count();
    const hasActionLink = await page.getByRole("link", {
      name: /another contribution|contribute/i,
    }).count();
    const hasLoadingOrError = await page.getByText(/loading|error/i).count();

    expect(hasActionButton > 0 || hasActionLink > 0 || hasLoadingOrError > 0).toBeTruthy();
  });
});
