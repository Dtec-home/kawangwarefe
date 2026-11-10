/** CH-2 / F4: a champion's own giving, end to end (ADR-0016). */

import { Then, When, expect } from "../support/fixtures";

Then("the champion page says {string}", async ({ page }, text: string) => {
  await expect(page.getByTestId("champion-own-giving")).toHaveText(text);
});

Then("the champion's WhatsApp message starts {string}", async ({ page }, start: string) => {
  await expect(page.getByTestId("champion-message")).toHaveText(new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});

When("they switch off showing their own giving", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Show how much I've given on my page and share message" });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
});

Then("champion {string}'s public page no longer shows or sends their own giving", async ({ page, world }, code: string) => {
  const answer = page.waitForResponse(async (response) =>
    response.url().includes("graphql") && (response.request().postData() ?? "").includes("publicChampion"));
  await page.goto(`/campaigns/${world.values.campaignSlug}/c/${code}`);
  const body = await (await answer).json();
  expect(body.data.publicChampion.ownGiven).toBeNull();
  await expect(page.getByTestId("champion-totals")).toBeVisible();
  await expect(page.getByTestId("champion-own-giving")).toHaveCount(0);
});
