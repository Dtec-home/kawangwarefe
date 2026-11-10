/**
 * MP-1/MP-2: a member's second number, from the profile through Pay Bill and sign-in.
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours, freshPhone } from "../support/desk";
import { signInThroughUi } from "../support/session";

const SECOND = "phones.second";

When("I add a second number from my profile with the code sent to it", async ({ page, backend, world }) => {
  const phone = freshPhone();
  world.values[SECOND] = phone;
  await dismissTours(backend, page, ["profile_v1", "welcome_tour"]);
  await page.goto("/profile");
  const before = await backend.lastSmsId();
  await page.getByLabel("New number").fill(`0${phone.slice(3)}`);
  await page.getByLabel("Label (optional)").fill("Airtel");
  await page.getByRole("button", { name: "Send code" }).click();
  const code = await backend.latestCode(phone, before);
  await page.getByLabel(/Code sent to/).fill(code);
  await page.getByRole("button", { name: "Confirm" }).click();
});

Then("my profile lists the second number", async ({ page, world }) => {
  const local = `0${world.values[SECOND].slice(3)}`;
  const shown = `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  const list = page.getByRole("list", { name: "Phone numbers" });
  await expect(list.getByText(shown)).toBeVisible();
  await expect(list.getByText("Airtel")).toBeVisible();
});

When(
  "the second number pays {int} to {string} by Pay Bill as {string}",
  async ({ backend, world }, amount: number, account: string, name: string) => {
    world.values["phones.membersBefore"] = String(await countMembers(backend, world.seed!.people.admin.phone));
    await backend.paybill(world.values[SECOND], String(amount), account, name);
  },
);

Then("the {int} is Mary Wanjiku's and no new member was created", async ({ backend, world }, amount: number) => {
  const token = await backend.tokenFor(world.seed!.people.admin.phone);
  const member = await backend.graphql(
    `query($p: String!) { memberByPhone(phoneNumber: $p) { fullName } }`, { p: world.values[SECOND] }, token,
  );
  expect(member.data.memberByPhone.fullName).toBe("Mary Wanjiku");
  const gifts = await backend.graphql(
    `query($p: String!) { myContributions(phoneNumber: $p) { amount status } }`,
    { p: world.seed!.people.member.phone }, token,
  );
  const amounts = gifts.data.myContributions.map((g: { amount: string }) => Number(g.amount));
  expect(amounts).toContain(amount);
  expect(await countMembers(backend, world.seed!.people.admin.phone)).toBe(Number(world.values["phones.membersBefore"]));
});

When("I sign in again with the second number", async ({ page, backend, world }) => {
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.clear());
  await page.context().clearCookies();
  await signInThroughUi(page, backend, world.values[SECOND]);
});

Then("I am signed in as Mary Wanjiku", async ({ backend, world }) => {
  const token = await backend.tokenFor(world.values[SECOND]);
  const me = await backend.graphql(`query { me { fullName phoneNumber } }`, {}, token);
  expect(me.data.me).toEqual({ fullName: "Mary Wanjiku", phoneNumber: world.seed!.people.member.phone });
});

async function countMembers(backend: import("../support/backend").Backend, adminPhone: string): Promise<number> {
  const token = await backend.tokenFor(adminPhone);
  const result = await backend.graphql(`query { membersList(limit: 1) { total } }`, {}, token);
  return result.data.membersList.total;
}

