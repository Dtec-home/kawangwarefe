/**
 * Lane E2E-D steps, part 2: the campaign's books. Expenses charged to the
 * campaign, the Statement tab and its exports, close-out, a Pay Bill to a
 * closed code, and the nightly finance integrity job.
 */

import { readFileSync } from "node:fs";
import { Page } from "@playwright/test";
import { Given, Then, When, expect } from "../support/fixtures";
import type { Backend } from "../support/backend";
import { KEYS, dismissTours, nairobiToday, pickOption, tokenOnce } from "../support/desk";

Given(
  "the member pays {int} by Pay Bill to the desk campaign's code",
  async ({ backend, world }, amount: number) => {
    const result = await backend.paybill(world.seed!.people.member.phone, String(amount), world.values[KEYS.campaignCode]);
    expect(result.status).toBe(200);
  },
);

/**
 * The expense dialog scrolls at every width (the dialog base no longer drops
 * its height cap on desktop), so the journeys use the default laptop screen;
 * "The expense form fits a laptop screen" in books.feature pins it.
 */

async function openExpenseDialog(page: Page, backend: Backend) {
  await dismissTours(backend, page, ["admin_expenses_v1"]);
  await page.goto("/admin/expenses");
  await page.getByRole("button", { name: "Request Expense" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

When(
  "the treasurer records a paid expense of {int} to {string} charged to the desk campaign",
  async ({ page, backend, world }, amount: number, payee: string) => {
    const dialog = await openExpenseDialog(page, backend);
    await pickOption(page, "exp-fund", "Building Fund");
    await page.locator("#exp-amount").fill(String(amount));
    await page.locator("#exp-date").fill(nairobiToday());
    await page.locator("#exp-payee").fill(payee);
    await page.locator("#exp-description").fill(`${payee} bill`);
    await expect(dialog.getByText("Charge to campaign")).toBeVisible();
    await pickOption(page, "exp-campaign", new RegExp(`^${world.values[KEYS.campaignTitle]} · `));
    await expect(page.locator("#exp-campaign")).toContainText(world.values[KEYS.campaignTitle]);
    await page.locator("#exp-auto-approve").check();
    await dialog.getByRole("button", { name: "Record Expense" }).click();
    await expect(dialog).toHaveCount(0);
  },
);

Then("the expenses list shows the bill to {string}", async ({ page }, payee: string) => {
  // The desktop table (the phone-sized cards are hidden at this width).
  const row = page.locator("tr").filter({ hasText: payee });
  await expect(row).toBeVisible();
  await expect(row).toContainText(/approved/i);
});

When("the treasurer opens the desk campaign's {string} tab", async ({ page, world }, tab: string) => {
  await page.goto(`/admin/campaigns/${world.values[KEYS.campaignId]}`);
  await page.getByRole("tab", { name: tab }).click();
  await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
});

Then(
  "the campaign statement shows money in {string}, money out {string} and balance {string}",
  async ({ page }, moneyIn: string, moneyOut: string, balance: string) => {
    const summary = page.getByTestId("statement-summary");
    await expect(summary).toBeVisible();
    const tile = (title: string) => summary.locator("[data-slot=card]").filter({ hasText: title });
    await expect(tile("Money in")).toContainText(moneyIn);
    await expect(tile("Money out")).toContainText(moneyOut);
    await expect(tile("Balance")).toContainText(balance);
    const totals = page.getByTestId("statement-totals");
    await expect(totals).toContainText(moneyIn);
    await expect(totals).toContainText(moneyOut);
  },
);

Then("the campaign statement lists the bill to {string}", async ({ page }, payee: string) => {
  await expect(page.getByTestId("statement-table")).toContainText(payee);
});

async function exportStatement(page: Page, button: string, extension: string) {
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: button }).click()]);
  expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${extension}$`));
  const bytes = readFileSync(await download.path());
  expect(bytes.length).toBeGreaterThan(200);
  return bytes;
}

Then("the campaign statement downloads as an Excel file", async ({ page }) => {
  const bytes = await exportStatement(page, "Export Excel", "xlsx");
  expect(bytes.subarray(0, 2).toString()).toBe("PK"); // xlsx is a zip
});

Then("the campaign statement downloads as a PDF file", async ({ page }) => {
  const bytes = await exportStatement(page, "Export PDF", "pdf");
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
});

When("the treasurer asks to close the desk campaign", async ({ page }) => {
  await page.getByRole("button", { name: "Close campaign" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
});

Then("the close-out warning says leftover money stays in {string}", async ({ page }, department: string) => {
  await expect(page.getByRole("alertdialog")).toContainText(`Any money left over stays in ${department}; nothing is moved.`);
});

Then(
  "the close-out warning says later Pay Bill payments to {string} are still credited to it",
  async ({ page }, code: string) => {
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("The campaign comes off the public site");
    await expect(dialog).toContainText(`Late Pay Bill payments to ${code} are still credited to it`);
  },
);

When("the treasurer confirms closing the desk campaign", async ({ page }) => {
  await page.getByRole("alertdialog").getByRole("button", { name: "Close campaign" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

Then("the close-out tab shows the campaign as closed", async ({ page, world }) => {
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("It is no longer public.");
  await expect(panel).toContainText(`Late Pay Bill payments to ${world.values[KEYS.campaignCode]} are still credited`);
  await expect(page.getByRole("button", { name: "Close campaign" })).toHaveCount(0);
});

Then("the desk campaign's public page can no longer be found", async ({ browser, world }) => {
  // A visitor who is not signed in.
  const visitor = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_FRONTEND_PORT ?? 3101}` });
  const page = await visitor.newPage();
  try {
    await page.goto(`/campaigns/${world.values[KEYS.campaignSlug]}`);
    await expect(page.getByText("We couldn't find that campaign")).toBeVisible();
    await expect(page.getByRole("heading", { name: world.values[KEYS.campaignTitle] })).toHaveCount(0);
  } finally {
    await visitor.close();
  }
});

Then(
  "the admin Pay Bill list shows the {int} to {string} as unmatched",
  async ({ page, backend }, amount: number, code: string) => {
    await dismissTours(backend, page, ["admin_c2b_transactions_v1"]);
    await page.goto("/admin/c2b-transactions");
    const toCode = page.locator("tbody tr").filter({ hasText: code });
    // The gift paid while the campaign was open was credited; only the late one waits.
    const waiting = toCode.filter({ hasText: "unmatched" });
    await expect(waiting).toHaveCount(1);
    await expect(waiting).toContainText(amount.toLocaleString("en-KE"));
    await expect(waiting.getByRole("button", { name: "Resolve" })).toBeVisible();
    await expect(toCode.filter({ hasText: "processed" })).toHaveCount(1);
  },
);

Then("the admin Pay Bill list shows both payments to {string} as credited", async ({ page, backend }, code: string) => {
  await dismissTours(backend, page, ["admin_c2b_transactions_v1"]);
  await page.goto("/admin/c2b-transactions");
  const toCode = page.locator("tbody tr").filter({ hasText: code });
  // A closed campaign still receives money: the late payment is credited like the first.
  await expect(toCode.filter({ hasText: "processed" })).toHaveCount(2);
  await expect(toCode.filter({ hasText: "unmatched" })).toHaveCount(0);
});

Given("the treasurer has paused the desk campaign", async ({ backend, world }) => {
  const token = await tokenOnce(backend, world.values, world.seed!.people.treasurer.phone);
  const result = await backend.graphql(
    `mutation($id: ID!) { pauseCampaign(id: $id) { success message } }`,
    { id: world.values[KEYS.campaignId] },
    token,
  );
  expect(result.data?.pauseCampaign, JSON.stringify(result)).toMatchObject({ success: true });
});

Given(
  "the treasurer has charged a paid bill of {int} to the desk campaign",
  async ({ backend, world }, amount: number) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.treasurer.phone);
    const result = await backend.graphql(
      `mutation($c: ID!, $a: String!, $d: String!, $camp: ID) {
        createExpense(categoryId: $c, amount: $a, expenseDate: $d, payee: "Roof contractor", autoApprove: true, campaignId: $camp) { success message }
      }`,
      { c: String(world.seed!.departments.BLDG.id), a: `${amount}.00`, d: nairobiToday(), camp: world.values[KEYS.campaignId] },
      token,
    );
    expect(result.data?.createExpense, JSON.stringify(result)).toMatchObject({ success: true });
  },
);

When("the finance integrity job runs", async ({ backend, world }) => {
  world.values["desk.integrity"] = JSON.stringify(await backend.runJob("finance-integrity"));
});

Then("the finance integrity job reports no campaign problems", async ({ world }) => {
  const result = JSON.parse(world.values["desk.integrity"]) as { extra: string[]; smsSentTo: string[] };
  expect(result.extra).toEqual([]);
  expect(result.smsSentTo).toEqual([]);
});

When("the treasurer opens the expense form on a 1280 by 720 desktop screen", async ({ page, backend }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openExpenseDialog(page, backend);
});

Then("the expense form's save button can be reached", async ({ page }) => {
  const save = page.getByRole("dialog").getByRole("button", { name: "Submit Request" });
  await save.scrollIntoViewIfNeeded().catch(() => undefined);
  await expect(save).toBeInViewport();
});
