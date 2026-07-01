import { test, expect } from '@playwright/test'

/**
 * Homepage E2E Tests
 *
 * ISTQB Principle 4 (Defect Clustering): deepest assertions on the most-visited page.
 * ISTQB Principle 7 (Absence-of-errors fallacy): tests user journeys, not just "no crash".
 * Resilient: assertions check UI structure — not specific backend data values.
 */

test.describe('Homepage — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('page title contains "Church" or "SDA"', async ({ page }) => {
    await expect(page).toHaveTitle(/church|sda/i)
  })

  test('sticky navigation bar is visible', async ({ page }) => {
    await expect(page.locator('nav').first()).toBeVisible()
  })

  test('navigation contains a "Give" or "Give Online" link', async ({ page }) => {
    const giveLink = page.getByRole('link', { name: /give/i }).first()
    await expect(giveLink).toBeVisible()
  })

  test('navigation contains a "Member Login" link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /member login/i })).toBeVisible()
  })

  test('navigation contains "Devotionals" link', async ({ page }) => {
    // Desktop nav links are hidden on mobile; use first() since BottomNav also has links
    await expect(page.getByRole('link', { name: /devotionals/i }).first()).toBeVisible()
  })

  test('navigation contains "Events" link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /events/i }).first()).toBeVisible()
  })
})

test.describe('Homepage — Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('H1 contains "Seventh-Day" or "Adventist"', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText(/seventh-day|adventist/i)
  })

  test('"Give Online" CTA button is visible in the hero', async ({ page }) => {
    const cta = page.getByRole('link', { name: /give online/i }).first()
    await expect(cta).toBeVisible()
  })

  test('"Give Online" CTA links to /contribute', async ({ page }) => {
    const cta = page.getByRole('link', { name: /give online/i }).first()
    await expect(cta).toHaveAttribute('href', '/contribute')
  })

  test('Service times card displays "Sabbath Service"', async ({ page }) => {
    await expect(page.getByText(/sabbath service/i)).toBeVisible()
  })
})

test.describe('Homepage — Content Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Announcements section heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /announcements/i })).toBeVisible()
  })

  test('Devotionals section heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /daily devotionals/i })).toBeVisible()
  })

  test('Events section heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /upcoming events/i })).toBeVisible()
  })

  test('Watch & Listen section heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /watch & listen/i })).toBeVisible()
  })

  test('YouTube section does NOT contain a live iframe on initial load (lazy-embed)', async ({ page }) => {
    // Performance fix regression guard: featured video should be a thumbnail, not a live iframe
    const iframes = page.locator('iframe')
    const count = await iframes.count()
    expect(count).toBe(0)
  })
})

test.describe('Homepage — Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('footer contains copyright text', async ({ page }) => {
    const footer = page.locator('footer').first()
    await expect(footer).toBeVisible()
    await expect(footer).toContainText(/seventh-day adventist church kawangware/i)
  })

  test('footer contains "Give Online" link', async ({ page }) => {
    const footer = page.locator('footer').first()
    const giveLink = footer.getByRole('link', { name: /give online/i })
    await expect(giveLink).toBeVisible()
  })
})

test.describe('Homepage — Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('hamburger menu button is visible on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const hamburger = page.getByRole('button', { name: /toggle menu/i })
    await expect(hamburger).toBeVisible()
  })

  test('clicking hamburger opens mobile nav', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const hamburger = page.getByRole('button', { name: /toggle menu/i })
    await hamburger.click()
    // Mobile nav links should appear
    await expect(page.getByRole('link', { name: /give/i }).first()).toBeVisible()
  })
})
