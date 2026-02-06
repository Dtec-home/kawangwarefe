import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page is accessible', async ({ page }) => {
    await page.goto('/login')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check page title
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible()

    // Check phone input is visible
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByText('+254')).toBeVisible()

    // Check submit button
    await expect(page.getByRole('button', { name: /send|verify|login/i })).toBeVisible()
  })

  test('phone number validation works', async ({ page }) => {
    await page.goto('/login')

    await page.waitForLoadState('networkidle')

    const phoneInput = page.getByLabel(/phone/i)
    const submitButton = page.getByRole('button', { name: /send|verify|login/i })

    // Initially button should be disabled
    await expect(submitButton).toBeDisabled()

    // Fill valid phone number
    await phoneInput.fill('797030300')

    // Button should now be enabled
    await expect(submitButton).toBeEnabled()
  })

  test('displays back to home link', async ({ page }) => {
    await page.goto('/login')

    await page.waitForLoadState('networkidle')

    // Check for back link
    const backLink = page.getByRole('link', { name: /back|home/i })
    await expect(backLink).toBeVisible()
  })

  test('shows helper text for phone input', async ({ page }) => {
    await page.goto('/login')

    await page.waitForLoadState('networkidle')

    // Check for helper text
    await expect(page.getByText(/9-digit|m-pesa/i)).toBeVisible()
  })
})

test.describe('OTP Verification', () => {
  test('OTP page requires phone parameter', async ({ page }) => {
    // Try to access OTP page without phone parameter
    await page.goto('/verify-otp')

    await page.waitForLoadState('networkidle')

    // Should either redirect or show error
    const url = page.url()
    const hasOtpForm = await page.getByLabel(/otp|code|verification/i).count() > 0

    // If no phone param, should not show OTP form or should redirect
    if (!url.includes('phone=')) {
      expect(hasOtpForm).toBe(false)
    }
  })
})
