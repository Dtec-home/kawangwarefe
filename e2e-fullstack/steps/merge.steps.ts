/**
 * Member merge (MG-1, MG-2, F3): pick by phone numbers, merge, pay from the
 * old number, undo. Driven through the real pages; totals read from the API.
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours, freshPhone } from "../support/desk";
import type { Backend } from "../support/backend";
import type { World } from "../support/fixtures";
import { switchUserInBrowser } from "../support/campaigns";

const SECOND = "merge.secondPhone";

/** The sidebar's Members submenu opens by itself on a members page; elsewhere click it. */
async function openMembersMenu(page: import("@playwright/test").Page) {
  const members = page.getByRole("button", { name: /^Members/ });
  if ((await members.getAttribute("aria-expanded")) !== "true") await members.click();
}
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
  "I choose Merge… on the member's row and merge in the second number's record, giving the reason {string}",
  async ({ page, backend, world }, reason: string) => {
    const member = world.seed!.people.member;
    await dismissTours(backend, page, ["admin_members_v1"]);
    await page.goto("/admin/members");
    await page.getByLabel("Search").fill(local(member.phone));
    await page.getByRole("button", { name: `More actions for ${member.name}` }).first().click();
    await page.getByRole("menuitem", { name: /Merge/ }).click();
    await page.waitForURL(/\/admin\/members\/merge\?keep=/);
    // The member chosen on the list is the record to keep.
    await expect(page.getByLabel("Number of the record to keep")).toHaveValue(member.phone);
    await page.getByLabel("Number of the duplicate").fill(local(world.values[SECOND]));
    await page.getByRole("button", { name: "Find" }).click();
    await page.getByRole("button", { name: "Preview merge" }).click();
    await expect(page.getByText("Merge preview")).toBeVisible();
    await expect(page.getByText("2 gifts")).toBeVisible();
    await page.getByLabel("Reason").fill(reason);
    await page.getByLabel(/^Type .* to confirm$/).fill(member.name);
    await page.getByRole("button", { name: "Merge", exact: true }).click();
    await page.waitForURL(/\/admin\/members\/merges/);
  },
);

When("the second number pays {int} to {string} by Pay Bill", async ({ backend, world }, amount: number, ref: string) => {
  await backend.paybill(world.values[SECOND], String(amount), ref, "MARY");
});

When("I open Members, then Recent merges, and undo that merge because {string}", async ({ page }, reason: string) => {
  await page.goto("/admin/members");
  await openMembersMenu(page);
  await page.getByRole("button", { name: "Recent merges" }).click();
  await page.waitForURL(/\/admin\/members\/merges$/);
  await page.getByRole("button", { name: "Undo" }).first().click();
  await expect(page.getByText(/since the merge/)).toBeVisible();
  await page.getByLabel("Why undo this merge?").fill(reason);
  await page.getByRole("button", { name: "Undo merge" }).click();
  await expect(page.getByText("Undone", { exact: true })).toBeVisible({ timeout: 15_000 });
});

Then("the member has given {int} in total", async ({ backend, world }, total: number) => {
  await expect.poll(() => totalGiven(backend, world, world.seed!.people.member.phone)).toBe(total);
});

Then("the second number's record has given {int} in total", async ({ backend, world }, total: number) => {
  await expect.poll(() => totalGiven(backend, world, world.values[SECOND])).toBe(total);
});

When("I open the Members menu in the sidebar", async ({ page, backend }) => {
  await dismissTours(backend, page, ["admin_members_v1"]);
  await page.goto("/admin/contributions");
  await openMembersMenu(page);
});

When("I sign in as the pastor and open the Members menu in the sidebar", async ({ page, backend, world }) => {
  await switchUserInBrowser(page, backend, world, "pastor");
  await page.goto("/admin/contributions");
  await openMembersMenu(page);
});

Then("I see {string} and {string} in it", async ({ page }, first: string, second: string) => {
  await expect(page.getByRole("button", { name: first })).toBeVisible();
  await expect(page.getByRole("button", { name: second })).toBeVisible();
});

Then("I do not see {string} in it", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name: /All members/ })).toBeVisible();
  await expect(page.getByRole("button", { name })).toHaveCount(0);
});
