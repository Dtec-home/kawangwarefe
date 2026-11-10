/** DT-2: the daily total card and the 23:50 job, end to end (ADR-0015). */

import { Given, Then, When, expect } from "../support/fixtures";
import { campaignThroughApi } from "../support/campaigns";

Given(
  "the campaign {string} with code {string} and WhatsApp group {string} has been approved",
  async ({ backend, world }, title: string, code: string, group: string) => {
    await campaignThroughApi(backend, world, { title, code, stage: "approved", whatsappGroupId: group });
  },
);

Then("the daily total preview says {string}", async ({ page }, text: string) => {
  await expect(page.getByTestId("daily-total-preview")).toContainText(text, { timeout: 20_000 });
});

Then(
  "the daily total preview lists {string} then {string} under {string}",
  async ({ page }, first: string, second: string, heading: string) => {
    const preview = page.getByTestId("daily-total-preview");
    await expect(preview).toContainText(heading, { timeout: 20_000 });
    const text = (await preview.textContent()) ?? "";
    const after = text.slice(text.indexOf(heading));
    expect(after).toContain(`1. ${first}`);
    expect(after).toContain(`2. ${second}`);
  },
);

When("I post the daily total to the group now", async ({ page }) => {
  const button = page.getByTestId("daily-total-card").getByRole("button", { name: "Post to group now" });
  await expect(button).toBeEnabled();
  await button.click();
});

Then("I am told {string}", async ({ page }, message: string) => {
  await expect(page.getByText(message).first()).toBeVisible();
});

Then("I am told to wait before posting again", async ({ page }) => {
  await expect(page.getByText(/Please wait 10 minutes/).first()).toBeVisible();
});

Then(
  "the WhatsApp group {string} has {int} post(s) saying {string}",
  async ({ backend }, group: string, count: number, text: string) => {
    await expect.poll(async () => (await backend.groupPosts())
      .filter((post) => post.group_id === group && post.body.includes(text)).length).toBe(count);
  },
);

When("the 23:50 daily total job runs twice", async ({ backend }) => {
  await backend.runJob("daily-totals");
  await backend.runJob("daily-totals");
});

Then("the daily total card says the last automatic post was sent", async ({ page }) => {
  await expect(page.getByTestId("daily-total-last-post")).toContainText(/Last daily total for .*: sent/);
});
