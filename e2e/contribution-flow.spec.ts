import { test, expect } from '@playwright/test'

test.describe('Contribution Flow', () => {
  test('contribution form is accessible and displays correctly', async ({ page }) => {
    await page.goto('/contribute')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check page title
    await expect(page.getByRole('heading', { name: /contribution/i })).toBeVisible()

    // Check form elements are visible
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByText('+254')).toBeVisible()

    // Check for amount input or category selection
    const hasAmountInput = await page.getByLabel(/amount/i).count() > 0
    const hasCategorySelect = await page.getByLabel(/category/i).count() > 0

    expect(hasAmountInput || hasCategorySelect).toBe(true)
  })

  test('form validation works', async ({ page }) => {
    await page.goto('/contribute')

    await page.waitForLoadState('networkidle')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit|contribute|proceed/i })

    // Check if submit button exists and is initially disabled or requires input
    if (await submitButton.count() > 0) {
      const isDisabled = await submitButton.isDisabled()
      expect(isDisabled).toBe(true)
    }
  })

  test('phone number input accepts valid format', async ({ page }) => {
    await page.goto('/contribute')

    await page.waitForLoadState('networkidle')

    // Fill phone number
    const phoneInput = page.getByLabel(/phone/i)
    await phoneInput.fill('797030300')

    // Verify input value
    await expect(phoneInput).toHaveValue('797030300')
  })

  test('displays security and trust indicators', async ({ page }) => {
    await page.goto('/contribute')

    await page.waitForLoadState('networkidle')

    // Check for security/trust indicators
    const secureText = page.getByText(/secure|safe|encrypted/i)
    const mpesaText = page.getByText(/m-pesa/i)

    const hasSecurityIndicator = await secureText.count() > 0
    const hasMpesaIndicator = await mpesaText.count() > 0

    expect(hasSecurityIndicator || hasMpesaIndicator).toBe(true)
  })
})
