import { test, expect } from '@playwright/test';

/**
 * Race condition bug demo:
 * 1) User starts contribution from UI
 * 2) Extract checkoutRequestId from real GraphQL mutation response
 * 3) Send success callback (ResultCode:0)
 * 4) Send failed callback (ResultCode:1032) for same checkoutRequestId
 * 5) UI should remain in success state, but if bug exists, status may regress to failed
 */

test.describe('Race condition: success then failed callback', () => {
  test('Terminal status should not regress', async ({ page, request }) => {
    test.slow();
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';

    await page.goto('/contribute');
    await page.getByLabel(/phone/i).fill('797030300');
    await page.getByText(/select category/i).first().click();
    const buildingOption = page.getByRole('option', { name: /building fund/i }).first();
    if (await buildingOption.count()) {
      await buildingOption.click();
    } else {
      await page.getByRole('option').first().click();
    }
    await page.locator('#amount-0').fill('500');
    await page.getByRole('button', { name: /review contribution/i }).click();
    await expect(page.getByRole('heading', { name: /contribution summary/i })).toBeVisible();

    const mutationResponsePromise = page.waitForResponse((resp) => {
      const isGraphql = resp.url().includes('/graphql');
      const postData = resp.request().postData() ?? '';
      const isInitiate =
        postData.includes('InitiateMultiContribution') ||
        postData.includes('initiateMultiCategoryContribution');
      return isGraphql && isInitiate;
    });

    await page.getByRole('button', { name: /confirm & send m-pesa prompt/i }).click();
    await expect(page.getByRole('heading', { name: /waiting for payment confirmation/i })).toBeVisible();
    const mutationResponse = await mutationResponsePromise;
    const mutationJson = await mutationResponse.json();
    const checkoutRequestId = mutationJson?.data?.initiateMultiCategoryContribution?.checkoutRequestId;
    expect(checkoutRequestId, 'checkoutRequestId must exist').toBeTruthy();

    // 1. Send success callback
    const successPayload = {
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
              { Name: 'TransactionDate', Value: 20260309123000 },
              { Name: 'PhoneNumber', Value: 254797030300 },
            ],
          },
        },
      },
    };
    const successResp = await request.post(`${backendUrl}/api/pay/callback/`, {
      headers: { 'Content-Type': 'application/json' },
      data: successPayload,
    });
    expect(successResp.ok()).toBeTruthy();
    const successJson = await successResp.json();
    expect(successJson?.ResultCode).toBe(0);

    // Wait for UI to show success
    await expect(page.getByText(/payment completed successfully/i)).toBeVisible({ timeout: 30000 });

    // 2. Send failed callback (should be ignored, but bug may regress status)
    const failedPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'qa_mock_merchant_123',
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user',
        },
      },
    };
    const failedResp = await request.post(`${backendUrl}/api/pay/callback/`, {
      headers: { 'Content-Type': 'application/json' },
      data: failedPayload,
    });
    expect(failedResp.ok()).toBeTruthy();
    const failedJson = await failedResp.json();
    expect(failedJson?.ResultCode).toBe(0);

    // UI should still show success (if bug exists, it may regress to input or error)
    await expect(page.getByText(/payment completed successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
