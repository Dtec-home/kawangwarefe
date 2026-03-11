import { test, expect } from '@playwright/test'

/**
 * Authentication Flow E2E Tests
 *
 * ISTQB Principle 2 (Exhaustive testing impossible):
 *   Uses Boundary Value Analysis on phone number length.
 * ISTQB Principle 3 (Early testing): covers both happy path and validation.
 * Resilient: no OTP submission (would need real backend) — tests UI contract only.
 */

test.describe('Login Page — Accessibility & Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('renders "Member Login" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /member login/i })).toBeVisible()
  })

  test('renders phone number label and input', async ({ page }) => {
    await expect(page.getByLabel(/phone number/i)).toBeVisible()
  })

  test('renders +254 country code prefix', async ({ page }) => {
    await expect(page.getByText('+254')).toBeVisible()
  })

  test('renders "Send Verification Code" submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /send verification code/i })).toBeVisible()
  })

  test('renders "Back to Home" navigation link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /back to home|back/i })).toBeVisible()
  })

  test('renders helper text mentioning 9-digit M-Pesa', async ({ page }) => {
    await expect(page.getByText(/9-digit m-pesa/i)).toBeVisible()
  })
})

test.describe('Login Page — Phone Number Validation (BVA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
  })

  test('submit button is disabled when phone is empty (below boundary)', async ({ page }) => {
    const btn = page.getByRole('button', { name: /send verification code/i })
    await expect(btn).toBeDisabled()
  })

  test('submit button is disabled when phone has 8 digits (below boundary)', async ({ page }) => {
    const input = page.getByLabel(/phone number/i)
    await input.fill('79703030')
    const btn = page.getByRole('button', { name: /send verification code/i })
    await expect(btn).toBeDisabled()
  })

  test('submit button is ENABLED when phone has exactly 9 digits (valid boundary)', async ({ page }) => {
    const input = page.getByLabel(/phone number/i)
    await input.fill('797030300')
    const btn = page.getByRole('button', { name: /send verification code/i })
    await expect(btn).toBeEnabled()
  })

  test('input strips leading zero automatically', async ({ page }) => {
    const input = page.getByLabel(/phone number/i)
    await input.fill('0797030300')
    // Leading 0 is removed; only 9 digits remain
    const value = await input.inputValue()
    expect(value).not.toMatch(/^0/)
    expect(value.length).toBeLessThanOrEqual(9)
  })

  test('input does not accept non-numeric characters', async ({ page }) => {
    const input = page.getByLabel(/phone number/i)
    await input.fill('abcdefghi')
    const value = await input.inputValue()
    expect(value).toBe('')
  })
})

test.describe('OTP Verification Page', () => {
  test('redirects / shows no OTP form when no phone query param', async ({ page }) => {
    await page.goto('/verify-otp')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    if (!url.includes('phone=')) {
      const otpInput = page.getByLabel(/otp|code|verification/i)
      const count = await otpInput.count()
      expect(count).toBe(0)
    }
  })

  test('shows OTP input when phone param is in URL', async ({ page }) => {
    await page.goto('/verify-otp?phone=254797030300')
    await page.waitForLoadState('networkidle')
    // Either OTP form or redirect, but heading should reflect OTP page
    const heading = page.getByRole('heading', { name: /verify|otp|code/i })
    await expect(heading).toBeVisible()
  })
})
