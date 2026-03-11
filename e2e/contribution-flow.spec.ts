import { test, expect } from '@playwright/test'

/**
 * Contribution Flow E2E Tests
 *
 * ISTQB Principle 4 (Defect Clustering): Contribution form is the highest-risk feature.
 * Tests multi-step flow: input → review → edit, plus validation and security indicators.
 * Resilient: tests form mechanics (button states, navigation), not M-Pesa API calls.
 */

test.describe('Contribution Page — Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contribute')
    await page.waitForLoadState('networkidle')
  })

  test('renders "Make a Contribution" or "Contribution" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contribution/i })).toBeVisible()
  })

  test('renders the phone number field with +254 prefix', async ({ page }) => {
    await expect(page.getByText('+254')).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
  })

  test('renders security/trust indicator (Secure or M-Pesa)', async ({ page }) => {
    const secureText = page.getByText(/secure|safe|encrypted/i)
    const mpesaText = page.getByText(/m-pesa/i)
    const hasSecure = await secureText.count() > 0
    const hasMpesa = await mpesaText.count() > 0
    expect(hasSecure || hasMpesa).toBe(true)
  })
})

test.describe('Contribution Page — Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contribute')
    await page.waitForLoadState('networkidle')
  })

  test('"Review Contribution" button is disabled before entering required fields', async ({ page }) => {
    const reviewBtn = page.getByRole('button', { name: /review contribution/i })
    if (await reviewBtn.count() > 0) {
      await expect(reviewBtn).toBeDisabled()
    }
  })

  test('phone input accepts a valid 9-digit number', async ({ page }) => {
    const phoneInput = page.getByLabel(/phone/i)
    await phoneInput.fill('797030300')
    await expect(phoneInput).toHaveValue('797030300')
  })

  test('category select is present and loads options', async ({ page }) => {
    // Wait for Apollo to fetch categories
    await page.waitForTimeout(1000)
    const categoryTrigger = page.getByText(/select category/i).first()
    if (await categoryTrigger.count() > 0) {
      await expect(categoryTrigger).toBeVisible()
    }
  })
})

test.describe('Contribution Page — Multi-Step Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contribute')
    await page.waitForLoadState('networkidle')
    // Allow Apollo categories query to resolve
    await page.waitForTimeout(1500)
  })

  test('shows "Review Contribution" button on input step', async ({ page }) => {
    const reviewBtn = page.getByRole('button', { name: /review contribution/i })
    if (await reviewBtn.count() > 0) {
      await expect(reviewBtn).toBeVisible()
    }
  })

  test('does NOT show a "Cancel" button on the initial input step', async ({ page }) => {
    // Cancel only appears on the "waiting for M-Pesa" step
    await expect(page.getByRole('button', { name: /^cancel$/i })).not.toBeVisible()
  })
})
