/**
 * Department-backed campaigns (DEPARTMENT_CAMPAIGNS DC-4): the counting choice
 * on the form, the four-eyes change on the Overview, and what staff see.
 */

import { Page } from "@playwright/test";
import { Given, Then, When, expect } from "../support/fixtures";
import {
  campaignThroughApi,
  kes,
  knownCampaign,
  refOf,
  rememberCampaign,
  switchUserInBrowser,
  tokenOf,
} from "../support/campaigns";

const SLOW = { timeout: 30_000 };

function countingCard(page: Page) {
  return page.getByTestId("campaign-counting");
}

Given(
  "the department-backed campaign {string} with code {string} has been approved",
  async ({ backend, world }, title: string, code: string) => {
    await campaignThroughApi(backend, world, { title, code, stage: "approved", countingMode: "DEPARTMENT" });
  },
);

Given(
  "the department-backed campaign {string} with code {string} is awaiting approval",
  async ({ backend, world }, title: string, code: string) => {
    await campaignThroughApi(backend, world, { title, code, stage: "submitted", countingMode: "DEPARTMENT" });
  },
);

When(
  "I draft the campaign {string} for {string} with code {string} and a target of {int} counting all its department's giving",
  async ({ page, backend, world }, title: string, department: string, code: string, target: number) => {
    await page.goto("/admin/campaigns/new");
    await page.locator("#campaign-title").fill(title);
    await page.locator("#campaign-department").click();
    await page.getByRole("option", { name: department, exact: true }).click();
    await page.locator("#campaign-target").fill(String(target));
    await page.locator("#campaign-code").fill(code);
    // The radio itself is visually hidden; people click its card.
    await page.getByText(`All ${department} giving`, { exact: true }).click();
    await expect(page.getByRole("radio", { name: new RegExp(`All ${department} giving`) })).toBeChecked();
    await page.getByRole("button", { name: "Save as draft" }).click();
    await expect(page).toHaveURL(/\/admin\/campaigns\/\d+/, SLOW);
    const id = page.url().match(/\/admin\/campaigns\/(\d+)/)![1];
    const token = await tokenOf(backend, world, "admin");
    const result = await backend.graphql(
      `query($id: ID!) { campaign(id: $id) { id slug title paybillCode categoryId purposeId countingMode } }`,
      { id },
      token,
    );
    expect(result.data.campaign.title).toBe(title);
    expect(result.data.campaign.countingMode).toBe("DEPARTMENT");
    rememberCampaign(world, refOf(result.data.campaign));
  },
);

When(
  "I ask for {string} to count all {string} giving",
  async ({ page }, _title: string, department: string) => {
    await countingCard(page).getByRole("button", { name: `Ask to count all ${department} giving` }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(`every past and future ${department} gift is counted`);
    await dialog.getByRole("button", { name: "Send for approval" }).click();
  },
);

Then(
  "the counting change waits for a second approver, asked by {string}",
  async ({ page }, name: string) => {
    const card = countingCard(page);
    await expect(card.getByText("Waiting for a second approver")).toBeVisible(SLOW);
    await expect(card).toContainText(`asked by ${name}`);
  },
);

Then("the campaign overview offers me no way to approve the counting change", async ({ page }) => {
  await expect(countingCard(page).getByRole("button", { name: "Withdraw request" })).toBeVisible();
  await expect(countingCard(page).getByRole("button", { name: "Approve change" })).toHaveCount(0);
});

When(
  "the pastor signs in and approves the counting change of {string}",
  async ({ page, backend, world }, title: string) => {
    await switchUserInBrowser(page, backend, world, "pastor");
    await page.goto(`/admin/campaigns/${knownCampaign(world, title).id}`);
    await countingCard(page).getByRole("button", { name: "Approve change" }).click(SLOW);
    await page.getByRole("alertdialog").getByRole("button", { name: "Approve change" }).click();
  },
);

Then(
  "the campaign overview says it counts all {string} giving",
  async ({ page }, department: string) => {
    await expect(page.getByTestId("campaign-department-backed")).toHaveText(
      `Counts all ${department} giving`,
      SLOW,
    );
  },
);

Then("the campaign overview shows KES {int} raised", async ({ page }, raised: number) => {
  await expect(page.locator('[data-slot="campaign-progress"]').first()).toContainText(kes(raised), SLOW);
});

When("I rename the campaign to {string} in the campaign form", async ({ page, world }, title: string) => {
  await page.getByRole("button", { name: "Edit" }).click();
  const radio = page.getByRole("radio", { name: /All .+ giving/ });
  await expect(radio).toBeChecked();
  world.values.countingDisabled = String(await radio.isDisabled());
  await page.locator("#campaign-title").fill(title);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible(SLOW);
});

Then("the campaign form showed the counting choice as read-only", async ({ world }) => {
  expect(world.values.countingDisabled).toBe("true");
});

Then("the pastor is told {string}", async ({ page }, message: string) => {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: message }).first()).toBeVisible(SLOW);
});
