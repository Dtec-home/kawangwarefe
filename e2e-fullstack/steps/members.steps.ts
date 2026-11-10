/**
 * MP-0: adding a member whose number already gave by Pay Bill (/admin/members).
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours, freshPhone } from "../support/desk";

const PHONE = "members.payerPhone";

Given(
  "a phone new to the church pays {int} and then {int} to {string} by Pay Bill as {string}",
  async ({ backend, world }, first: number, second: number, account: string, name: string) => {
    const phone = freshPhone();
    world.values[PHONE] = phone;
    await backend.paybill(phone, String(first), account, name);
    await backend.paybill(phone, String(second), account, name);
  },
);

When(
  "the admin adds the member {string} {string} with that phone",
  async ({ page, backend, world }, firstName: string, lastName: string) => {
    await dismissTours(backend, page, ["admin_members_v1"]);
    await page.goto("/admin/members");
    await page.getByRole("button", { name: "Add Member" }).click();
    const dialog = page.getByRole("dialog", { name: "Add New Member" });
    await dialog.getByPlaceholder("John", { exact: true }).fill(firstName);
    await dialog.getByPlaceholder("Doe", { exact: true }).fill(lastName);
    await dialog.getByPlaceholder("0712345678", { exact: true }).fill(`0${world.values[PHONE].slice(3)}`);
    await dialog.getByRole("button", { name: "Create Member" }).click();
  },
);

Then(
  "the admin is offered the Pay Bill record {string} with {string} in {int} payments",
  async ({ page }, payerName: string, amount: string, count: number) => {
    const offer = page.getByTestId("payer-record-offer");
    await expect(offer).toBeVisible();
    await expect(offer).toContainText(`has already given ${amount} in ${count} Pay Bill payments as ${payerName}`);
  },
);

When("the admin uses that record", async ({ page }) => {
  await page.getByRole("button", { name: "Use this record" }).click();
});

Then("the admin sees {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then(
  "the member with that phone is {string} with {int} gifts totalling {int}",
  async ({ backend, world }, fullName: string, count: number, total: number) => {
    const token = await backend.tokenFor(world.seed!.people.admin.phone);
    const phone = world.values[PHONE];
    const member = await backend.graphql(
      `query($p: String!) { memberByPhone(phoneNumber: $p) { fullName isGuest } }`, { p: phone }, token,
    );
    expect(member.data.memberByPhone).toEqual({ fullName, isGuest: false });
    const gifts = await backend.graphql(
      `query($p: String!) { myContributions(phoneNumber: $p) { amount status } }`, { p: phone }, token,
    );
    const completed = gifts.data.myContributions.filter((g: { status: string }) => g.status === "completed");
    expect(completed).toHaveLength(count);
    expect(completed.reduce((sum: number, g: { amount: string }) => sum + Number(g.amount), 0)).toBe(total);
  },
);
