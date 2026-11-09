/** W4: the channel column on the admin contributions list. */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours } from "../support/desk";

Given("the member gives {int} by Pay Bill with the account {string}", async ({ backend, world }, amount: number, account: string) => {
  await backend.paybill(world.seed!.people.member.phone, String(amount), account, "MARY");
});

When("I open the contributions list", async ({ page, backend }) => {
  await dismissTours(backend, page, ["admin_contributions_v1"]);
  await page.goto("/admin/contributions");
});

Then("the {int} gift shows the channel {string}", async ({ page }, amount: number, label: string) => {
  const row = page.getByRole("row").filter({ hasText: `KES ${amount.toLocaleString()}` }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row.getByTestId("contribution-channel")).toHaveText(label);
});
