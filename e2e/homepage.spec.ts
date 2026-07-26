import { test, expect, Page } from '@playwright/test'

/**
 * Homepage E2E Tests
 *
 * ISTQB Principle 4 (Defect Clustering): deepest assertions on the most-visited page.
 * ISTQB Principle 7 (Absence-of-errors fallacy): tests user journeys, not just "no crash".
 * Resilient: assertions check UI structure — not specific backend data values.
 */

/**
 * HomeContent (components/landing/home-content.tsx) renders a full-page
 * loading spinner until GET_LANDING_PAGE_CONTENT (and GET_LEADERS) resolve —
 * neither the Announcements/Devotionals/Events/Watch & Listen section
 * headings nor the footer exist in the DOM until then. This spec ran with no
 * GraphQL mocking at all, so every test made a real network call to
 * NEXT_PUBLIC_GRAPHQL_URL (a LAN address in .env.local); when that host isn't
 * reachable the fetch can hang long enough to blow past "networkidle" and
 * even the 30s test timeout. Mock both queries with empty lists so the page
 * settles instantly and deterministically — the section *headings* render
 * unconditionally either way (only the card grid vs. empty-state depends on
 * the data).
 */
async function mockLandingPageContent(page: Page) {
  // DevotionalsSection also client-fetches /api/devotional, a Next.js API
  // route that reaches out to https://whiteestate.org server-side. This
  // sandbox has no outbound internet access, so that fetch hangs until it
  // hits its own ETIMEDOUT, which can outlast "networkidle" — short-circuit
  // it at the browser level so it never reaches the real route handler.
  await page.route('**/api/devotional**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ devotional: null }) })
  })
  await page.route(/\/graphql\/?$/, async (route, request) => {
    let query = ''
    try {
      query = request.postDataJSON()?.query ?? ''
    } catch {
      // ignore
    }
    if (query.includes('GetLandingPageContent')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { announcements: [], devotionals: [], events: [], youtubeVideos: [] },
        }),
      })
      return
    }
    if (query.includes('GetLeaders')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { leaders: [] } }),
      })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null }) })
  })
}

test.describe('Homepage — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // "networkidle" is unreliable against a Next.js dev server (webpack-dev
    // middleware/HMR keeps some connection activity going that can prevent
    // it from ever resolving, well past any reasonable timeout) — rely on
    // mocked GraphQL responses + each test's own expect(...).toBeVisible()
    // (which auto-retries) instead of waiting for total network silence.
    await mockLandingPageContent(page)
    await page.goto('/')
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
    // "networkidle" is unreliable against a Next.js dev server (webpack-dev
    // middleware/HMR keeps some connection activity going that can prevent
    // it from ever resolving, well past any reasonable timeout) — rely on
    // mocked GraphQL responses + each test's own expect(...).toBeVisible()
    // (which auto-retries) instead of waiting for total network silence.
    await mockLandingPageContent(page)
    await page.goto('/')
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
    // "networkidle" is unreliable against a Next.js dev server (webpack-dev
    // middleware/HMR keeps some connection activity going that can prevent
    // it from ever resolving, well past any reasonable timeout) — rely on
    // mocked GraphQL responses + each test's own expect(...).toBeVisible()
    // (which auto-retries) instead of waiting for total network silence.
    await mockLandingPageContent(page)
    await page.goto('/')
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
    // Wait for the section to actually mount before asserting an absence —
    // otherwise this could pass vacuously while HomeContent is still loading.
    await expect(page.getByRole('heading', { name: /watch & listen/i })).toBeVisible()
    // Performance fix regression guard: featured video should be a thumbnail,
    // not a live iframe. Scope to YouTube embeds specifically — the footer
    // has its own always-on Google Maps iframe (app/page.tsx) that is
    // unrelated to this lazy-embed guard and would otherwise false-fail this.
    const youtubeIframes = page.locator('iframe[src*="youtube"]')
    const count = await youtubeIframes.count()
    expect(count).toBe(0)
  })
})

test.describe('Homepage — Footer', () => {
  test.beforeEach(async ({ page }) => {
    // "networkidle" is unreliable against a Next.js dev server (webpack-dev
    // middleware/HMR keeps some connection activity going that can prevent
    // it from ever resolving, well past any reasonable timeout) — rely on
    // mocked GraphQL responses + each test's own expect(...).toBeVisible()
    // (which auto-retries) instead of waiting for total network silence.
    await mockLandingPageContent(page)
    await page.goto('/')
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
    await mockLandingPageContent(page)
    await page.goto('/')
    // "networkidle" is unreliable in Next.js dev mode (HMR/webpack-dev-server
    // keep some connection activity going, so it can hang well past 30s) —
    // the hamburger button doesn't depend on GraphQL data anyway, so just
    // wait for it directly; expect(...).toBeVisible() auto-retries.
    const hamburger = page.getByRole('button', { name: /toggle menu/i })
    await expect(hamburger).toBeVisible()
  })

  test('clicking hamburger opens mobile nav', async ({ page }) => {
    await mockLandingPageContent(page)
    await page.goto('/')
    const hamburger = page.getByRole('button', { name: /toggle menu/i })
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    // Mobile nav links should appear
    await expect(page.getByRole('link', { name: /give/i }).first()).toBeVisible()
  })
})
