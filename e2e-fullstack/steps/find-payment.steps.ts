/** W1: "Find payment by M-Pesa code" on the Pay Bill (C2B) page. */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours } from "../support/desk";
import type { Page } from "@playwright/test";
import type { Backend } from "../support/backend";

const CODE = "findPayment.code";

async function lookUp(page: Page, backend: Backend, code: string) {
  await dismissTours(backend, page, ["admin_c2b_transactions_v1"]);
  await page.goto("/admin/c2b-transactions");
  await page.getByRole("button", { name: "Find payment by M-Pesa code" }).click();
  const dialog = page.getByRole("dialog", { name: "Find a payment by its M-Pesa code" });
  await dialog.getByLabel("M-Pesa code").fill(code);
  await dialog.getByRole("button", { name: "Find", exact: true }).click();
}

Given("the member gives {int} by Pay Bill and keeps the M-Pesa code", async ({ backend, world }, amount: number) => {
  const { transId } = await backend.paybill(world.seed!.people.member.phone, String(amount), "TITHE", "MARY");
  world.values[CODE] = transId;
});

When("I look up that M-Pesa code on the Pay Bill page", async ({ page, backend, world }) => {
  await lookUp(page, backend, world.values[CODE]);
});

When("I look up the M-Pesa code {string} on the Pay Bill page", async ({ page, backend }, code: string) => {
  await lookUp(page, backend, code);
});

Then("I am told the payment is already recorded", async ({ page, world }) => {
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(`already recorded. Search Pay Bill transactions for ${world.values[CODE]}`);
});

Then("I am told to try again shortly", async ({ page }) => {
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Try again shortly", { timeout: 30_000 });
});

Then("the lookup is listed as {string}", async ({ page }, outcome: string) => {
  await expect(page.getByRole("list", { name: "Recent lookups" }).getByText(outcome).first()).toBeVisible();
});
