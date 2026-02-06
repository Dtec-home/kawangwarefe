import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads correctly and displays main sections', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check navigation is visible
    const nav = page.locator('nav, header').first()
    await expect(nav).toBeVisible()

    // Check main content is visible
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Check for key sections (these may load dynamically)
    await expect(page.locator('text=/church|sda|kawangware/i').first()).toBeVisible()
  })

  test('navigate to contribute page', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Find and click contribute link
    const contributeLink = page.getByRole('link', { name: /contribute|give|donation/i }).first()
    await contributeLink.click()

    // Verify we're on the contribute page
    await expect(page).toHaveURL(/\/contribute/)
    await expect(page.getByRole('heading', { name: /contribution/i })).toBeVisible()
  })

  test('footer is visible', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    // Check footer exists
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})
