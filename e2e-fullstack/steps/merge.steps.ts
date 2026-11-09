/**
 * Member merge (MG-1, MG-2, F3): pick by phone numbers, merge, pay from the
 * old number, undo. Driven through the real pages; totals read from the API.
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours, freshPhone } from "../support/desk";
import type { Backend } from "../support/backend";
import type { World } from "../support/fixtures";

const SECOND = "merge.secondPhone";
const local = (phone: string) => `0${phone.slice(3)}`;

async function totalGiven(backend: Backend, world: World, phone: string): Promise<number> {
  const token = await backend.tokenFor(world.seed!.people.admin.phone);
  const result = await backend.graphql(
    `query($p: String!) { myContributions(phoneNumber: $p, limit: 100) { amount status } }`, { p: phone }, token);
  return (result.data?.myContributions ?? [])
    .filter((c: { status: string }) => c.status === "completed")
    .reduce((sum: number, c: { amount: string }) => sum + Number(c.amount), 0);
}

Given(
  "a second number of the member pays {int} to {string} and {int} to {string} by Pay Bill as {string}",
  async ({ backend, world }, a1: number, ref1: string, a2: number, ref2: string, name: string) => {
    const phone = freshPhone();
    world.values[SECOND] = phone;
    await backend.paybill(phone, String(a1), ref1, name);
    await backend.paybill(phone, String(a2), ref2, name);
  },
);

Given("the member pays {int} to {string} by Pay Bill from the member's own number", async ({ backend, world }, amount: number, ref: string) => {
  await backend.paybill(world.seed!.people.member.phone, String(amount), ref, "MARY");
});

When(
  "I merge the second number's record into the member, giving the reason {string}",
  async ({ page, backend, world }, reason: string) => {
    await dismissTours(backend, page, ["admin_members_v1"]);
    await page.goto("/admin/members/merge");
    await page.getByLabel("Number of the record to keep").fill(local(world.seed!.people.member.phone));
    await page.getByLabel("Number of the duplicate").fill(local(world.values[SECOND]));
    await page.getByRole("button", { name: "Find" }).click();
    await page.getByRole("button", { name: "Preview merge" }).click();
    await expect(page.getByText("Merge preview")).toBeVisible();
    await expect(page.getByText("2 gifts")).toBeVisible();
    await page.getByLabel("Reason").fill(reason);
    await page.getByLabel(/^Type .* to confirm$/).fill(world.seed!.people.member.name);
    await page.getByRole("button", { name: "Merge", exact: true }).click();
    await page.waitForURL(/\/admin\/members\/merges/);
  },
);

When("the second number pays {int} to {string} by Pay Bill", async ({ backend, world }, amount: number, ref: string) => {
  await backend.paybill(world.values[SECOND], String(amount), ref, "MARY");
});

When("I undo that merge because {string}", async ({ page }, reason: string) => {
  await page.goto("/admin/members/merges");
  await page.getByRole("button", { name: "Undo" }).first().click();
  await expect(page.getByText(/since the merge/)).toBeVisible();
  await page.getByLabel("Why undo this merge?").fill(reason);
  await page.getByRole("button", { name: "Undo merge" }).click();
  await expect(page.getByText("Undone")).toBeVisible({ timeout: 15_000 });
});

Then("the member has given {int} in total", async ({ backend, world }, total: number) => {
  await expect.poll(() => totalGiven(backend, world, world.seed!.people.member.phone)).toBe(total);
});

Then("the second number's record has given {int} in total", async ({ backend, world }, total: number) => {
  await expect.poll(() => totalGiven(backend, world, world.values[SECOND])).toBe(total);
});
