import { test, expect } from '@playwright/test';

/**
 * Real callback E2E flow (no GraphQL mocking):
 * 1) User starts contribution from UI
 * 2) Extract checkoutRequestId from real GraphQL mutation response
 * 3) Send real STK callback to backend callback endpoint
 * 4) Verify UI transitions to success state
 *
 * Run with:
 *   BACKEND_URL=http://localhost:8000 npm run test:e2e -- mock-interview-live-callback.spec.ts
 */

test.describe('Live callback flow', () => {
  test('UI waits, callback arrives, payment becomes successful', async ({ page, request }) => {
    test.slow();

    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';

    await page.goto('/contribute');

    // Fill phone number
    await page.getByLabel(/phone/i).fill('797030300');

    // Select category (prefer Building Fund, fallback to first option)
    await page.getByText(/select category/i).first().click();

    const buildingOption = page.getByRole('option', { name: /building fund/i }).first();
    if (await buildingOption.count()) {
      await buildingOption.click();
    } else {
      await page.getByRole('option').first().click();
    }

    // Fill amount
    await page.locator('#amount-0').fill('500');

    // Go to summary
    await page.getByRole('button', { name: /review contribution/i }).click();
    await expect(page.getByRole('heading', { name: /contribution summary/i })).toBeVisible();

    // Start waiting for the real mutation response that contains checkoutRequestId
    const mutationResponsePromise = page.waitForResponse((resp) => {
      const isGraphql = resp.url().includes('/graphql');
      const postData = resp.request().postData() ?? '';
      const isInitiate =
        postData.includes('InitiateMultiContribution') ||
        postData.includes('initiateMultiCategoryContribution');
      return isGraphql && isInitiate;
    });

    // Confirm and send STK prompt
    await page.getByRole('button', { name: /confirm & send m-pesa prompt/i }).click();

    // UI should be on waiting screen
    await expect(
      page.getByRole('heading', { name: /waiting for payment confirmation/i })
    ).toBeVisible();

    // Read checkoutRequestId from real backend response
    const mutationResponse = await mutationResponsePromise;
    const mutationJson = await mutationResponse.json();

    const checkoutRequestId =
      mutationJson?.data?.initiateMultiCategoryContribution?.checkoutRequestId;

    expect(checkoutRequestId, 'checkoutRequestId must exist').toBeTruthy();

    // Send callback to backend (this simulates Safaricom callback)
    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'qa_mock_merchant_123',
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 500.0 },
              { Name: 'MpesaReceiptNumber', Value: 'QA-MOCK-12345' },
              { Name: 'TransactionDate', Value: 20260308123000 },
              { Name: 'PhoneNumber', Value: 254797030300 },
            ],
          },
        },
      },
    };

    const callbackResp = await request.post(`${backendUrl}/api/pay/callback/`, {
      headers: { 'Content-Type': 'application/json' },
      data: callbackPayload,
    });

    expect(callbackResp.ok()).toBeTruthy();

    const callbackJson = await callbackResp.json();
    expect(callbackJson?.ResultCode).toBe(0);

    // UI polls payment status every 2 sec; allow enough time
    await expect(page.getByText(/payment completed successfully/i)).toBeVisible({
      timeout: 30000,
    });
  });
});
