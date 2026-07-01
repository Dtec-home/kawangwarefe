import { test, expect } from '@playwright/test'

/**
 * Admin Flow E2E Tests
 *
 * ISTQB Principle 1 (Testing shows defects): verifies access control —
 *   unauthenticated users must not reach /admin.
 * ISTQB Principle 4 (Defect Clustering): auth guard is high-risk.
 * Resilient: tests redirect/UI structure without a real authenticated session.
 */

test.describe('Admin — Access Control (Unauthenticated)', () => {
  test('visiting /admin without auth redirects to /login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Either the URL contains /login, or the login heading is visible
    const url = page.url()
    const onLoginPage = url.includes('/login')
    const loginHeading = await page.getByRole('heading', { name: /login|sign in/i }).count()

    expect(onLoginPage || loginHeading > 0).toBe(true)
  })

  test('visiting /admin/contributions without auth redirects to /login', async ({ page }) => {
    await page.goto('/admin/contributions')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const onLoginPage = url.includes('/login')
    const loginHeading = await page.getByRole('heading', { name: /login|sign in/i }).count()
    expect(onLoginPage || loginHeading > 0).toBe(true)
  })

  test('visiting /admin/members without auth redirects to /login', async ({ page }) => {
    await page.goto('/admin/members')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const onLoginPage = url.includes('/login')
    const loginHeading = await page.getByRole('heading', { name: /login|sign in/i }).count()
    expect(onLoginPage || loginHeading > 0).toBe(true)
  })
})

test.describe('Login Page — Present Before Admin Access', () => {
  test('login page has correct structure when redirected from /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should show login page elements
    await expect(page.getByLabel(/phone number/i)).toBeVisible()
    await expect(page.getByText('+254')).toBeVisible()
  })
})
