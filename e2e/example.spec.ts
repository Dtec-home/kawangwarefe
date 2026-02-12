import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check that the page loads
  await expect(page).toHaveTitle(/Church/i);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check if main content is visible
  const main = page.locator('main');
  await expect(main).toBeVisible();
});
