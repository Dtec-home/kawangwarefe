/**
 * Lane E2E-D steps, part 1: recording campaign gifts at the desk (/record)
 * and in admin manual entry, then checking what staff see.
 */

import { Page } from "@playwright/test";
import { Given, Then, When, expect } from "../support/fixtures";
import { signInThroughUi } from "../support/session";
import {
  KEYS,
  createActiveCampaign,
  dismissTours,
  freshPhone,
  inviteChampion,
  pickOption,
} from "../support/desk";
import type { Backend } from "../support/backend";
import type { World } from "../support/fixtures";

/** Leave the current session and sign in as another seeded person. */
export async function switchUser(page: Page, backend: Backend, world: World, role: string) {
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.clear());
  await page.context().clearCookies();
  await signInThroughUi(page, backend, world.seed!.people[role].phone);
}

Given(
  "the Building Fund runs the desk campaign {string} with Pay Bill code {string}",
  async ({ backend, world }, title: string, code: string) => {
    const campaign = await createActiveCampaign(backend, world.seed!, world.values, { title, code });
    world.values[KEYS.campaignId] = campaign.id;
    world.values[KEYS.campaignSlug] = campaign.slug;
    world.values[KEYS.campaignTitle] = campaign.title;
    world.values[KEYS.campaignCode] = campaign.code;
  },
);

Given("John Kamau champions the desk campaign with the code {string}", async ({ backend, world }, code: string) => {
  await inviteChampion(backend, world.seed!, world.values, world.values[KEYS.campaignId], world.seed!.people.member2.phone, code);
});

When("the recorder opens the desk at {string} for a phone new to the church", async ({ page, world }, path: string) => {
  const phone = freshPhone();
  world.values[KEYS.newPhone] = phone;
  world.smsMark = 0;
  await page.goto(path);
  await expect(page.getByRole("form", { name: "Record a gift" })).toBeVisible();
  await page.locator("#phone").fill(`0${phone.slice(3)}`);
  await page.getByRole("button", { name: "Search" }).click();
});

Then("the desk asks for the new giver's full name", async ({ page }) => {
  await expect(page.getByTestId("giver-new")).toBeVisible();
  await expect(page.getByLabel("Giver's full name *")).toBeVisible();
  await expect(page.getByLabel("Giver's full name *")).toHaveValue("");
});

When(
  /^the desk line gives (\d+) to the Building Fund for the desk campaign(?: through champion "([A-Z0-9]+)")?$/,
  async ({ page, world }, amount: string | number, champion?: string) => {
    await pickOption(page, "category-0", "Building Fund");
    await page.locator("#amount-0").fill(String(amount));
    const campaignSelect = page.locator("#line-campaign-0");
    await expect(campaignSelect).toBeVisible();
    await pickOption(page, "line-campaign-0", world.values[KEYS.campaignTitle]);
    if (champion) await page.locator("#line-champion-0").fill(champion);
  },
);

When("the recorder marks the gift as an envelope and asks to review it", async ({ page }) => {
  await page.getByRole("radio", { name: "Envelope" }).click();
  await expect(page.getByRole("radio", { name: "Envelope" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: /Review & save/ }).click();
});

Then("the desk refuses with {string}", async ({ page }, message: string) => {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: message }).first()).toBeVisible();
  await expect(page.getByTestId("record-success")).toHaveCount(0);
});

When("the recorder enters the new giver's name {string}", async ({ page }, name: string) => {
  await page.getByLabel("Giver's full name *").fill(name);
});

When("the recorder asks to review and confirms the gift", async ({ page }) => {
  await page.getByRole("button", { name: /Review & save/ }).click();
  const sheet = page.getByRole("dialog", { name: "Confirm gift" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByTestId("confirm-summary")).toContainText("Envelope");
  await sheet.getByRole("button", { name: "Confirm & issue receipt" }).click();
});

When("the recorder goes back and corrects the champion code to {string}", async ({ page }, code: string) => {
  const sheet = page.getByRole("dialog", { name: "Confirm gift" });
  await sheet.getByRole("button", { name: "Back" }).click();
  await expect(sheet).toHaveCount(0);
  await page.locator("#line-champion-0").fill(code);
});

Then("the desk shows a receipt for {string} from {string}", async ({ page }, total: string, giver: string) => {
  const success = page.getByTestId("record-success");
  await expect(success).toBeVisible();
  await expect(page.getByTestId("issued-receipt-number")).not.toHaveText("—");
  await expect(success).toContainText(`${total} from ${giver}`);
  await expect(page.getByTestId("sms-status")).toHaveText("SMS receipt sent to the giver");
});

Then("the new giver receives a receipt SMS addressed to {string}", async ({ backend, world, page }, firstName: string) => {
  const receipt = (await page.getByTestId("issued-receipt-number").textContent())!.trim();
  const sms = await backend.expectSms(world.values[KEYS.newPhone], [receipt]);
  expect(sms.body).toContain(firstName);
  expect(sms.body).not.toContain("Guest");
});

When("the treasurer reviews the desk campaign's contributor list", async ({ page, backend, world }) => {
  await switchUser(page, backend, world, "treasurer");
  await page.goto(`/admin/campaigns/${world.values[KEYS.campaignId]}?tab=share`);
  await expect(page.getByText("Contributor list")).toBeVisible();
});

Then(
  "the contributor list shows {string} with {string} and no {string}",
  async ({ page }, name: string, total: string, placeholder: string) => {
    const preview = page.getByTestId("whatsapp-preview");
    await expect(preview).toContainText(name);
    await expect(preview).not.toContainText(placeholder);
    await expect(page.getByText("Total given").locator("..")).toContainText(total);
  },
);

Then(
  "the desk campaign's champion {string} is credited with {string} from {int} donor",
  async ({ page, world }, code: string, raised: string, donors: number) => {
    await page.getByRole("tab", { name: "Champions" }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/campaigns/${world.values[KEYS.campaignId]}\\?tab=champions`));
    const row = page.getByRole("row").filter({ has: page.getByRole("cell", { name: code, exact: true }) });
    await expect(row).toContainText("John Kamau");
    await expect(row).toContainText(raised);
    await expect(row.getByRole("cell", { name: String(donors), exact: true })).toBeVisible();
  },
);

When("the admin opens manual entry for the member's phone", async ({ page, backend, world }) => {
  await dismissTours(backend, page, ["admin_manual_entry_v1"]);
  world.smsMark = await backend.lastSmsId();
  await page.goto("/admin/contributions/manual-entry");
  await page.locator("#phone").fill(world.seed!.people.member.phone);
  await page.getByRole("button", { name: "Search" }).click();
});

Then("manual entry recognises the giver {string}", async ({ page }, name: string) => {
  await expect(page.getByText(name).first()).toBeVisible();
  await expect(page.getByLabel("Giver's full name *")).toHaveCount(0);
});

When("the admin saves the manual entry", async ({ page }) => {
  await page.getByRole("button", { name: "Save Contribution" }).click();
});

Then("manual entry issues a receipt", async ({ page }) => {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Receipt .+ issued/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Another", exact: true })).toBeVisible();
});
