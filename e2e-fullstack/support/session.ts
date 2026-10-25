/**
 * Signing in through the real login screens: phone → SMS code → verify.
 */

import { Page, expect } from "@playwright/test";
import { Backend } from "./backend";

export async function signInThroughUi(page: Page, backend: Backend, phone: string) {
  const before = await backend.lastSmsId();
  await page.goto("/login");
  await page.locator("#phoneNumber").fill(phone.replace(/^254/, ""));
  await page.getByRole("button", { name: "Send Verification Code" }).click();
  await page.waitForURL(/verify-otp/);
  const code = await backend.latestCode(phone, before);
  const boxes = page.locator('input[inputmode="numeric"][maxlength="1"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i]);
  await page.getByRole("button", { name: "Verify & Login" }).click();
  await expect(page).not.toHaveURL(/verify-otp|login/, { timeout: 30_000 });
}
