/**
 * F5: resolving an unmatched Pay Bill payment to an auto-split department.
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { dismissTours } from "../support/desk";

const TRANS = "c2b.transId";

Given(
  "{string} with code {string} splits giving {int}% to {string} and {int}% to {string}",
  async ({ backend, world }, name: string, code: string, p1: number, purpose1: string, p2: number, purpose2: string) => {
    const token = await backend.tokenFor(world.seed!.people.admin.phone);
    const cat = await backend.graphql(
      `mutation($n: String!, $c: String!) { createCategory(name: $n, code: $c, routingMode: "REQUIRES_PURPOSE") {
         success message category { id } } }`, { n: name, c: code }, token);
    expect(cat.data.createCategory.success, cat.data.createCategory.message).toBe(true);
    const categoryId = cat.data.createCategory.category.id;
    for (const [purpose, pct] of [[purpose1, p1], [purpose2, p2]] as const) {
      const made = await backend.graphql(
        `mutation($c: ID!, $n: String!) { createDepartmentPurpose(categoryId: $c, name: $n, code: $n) {
           success message purpose { id } } }`, { c: categoryId, n: purpose }, token);
      expect(made.data.createDepartmentPurpose.success, made.data.createDepartmentPurpose.message).toBe(true);
      const split = await backend.graphql(
        `mutation($c: ID!, $p: ID!, $pct: String!) { createPurposeAllocation(categoryId: $c, purposeId: $p, percentage: $pct) {
           success message } }`, { c: categoryId, p: made.data.createDepartmentPurpose.purpose.id, pct: `${pct}.00` }, token);
      expect(split.data.createPurposeAllocation.success, split.data.createPurposeAllocation.message).toBe(true);
    }
  },
);

Given("the member pays {int} by Pay Bill with the account {string}", async ({ backend, world }, amount: number, account: string) => {
  const paid = await backend.paybill(world.seed!.people.member.phone, String(amount), account, "MARY");
  world.values[TRANS] = paid.transId ?? paid.trans_id ?? "";
});

When(
  "I resolve that payment to {string} without choosing a purpose",
  async ({ page, backend }, department: string) => {
    await dismissTours(backend, page, ["admin_c2b_transactions_v1"]);
    await page.goto("/admin/c2b-transactions");
    await page.getByRole("button", { name: "Resolve" }).first().click();
    await page.getByRole("combobox", { name: "Department" }).click();
    await page.getByRole("option", { name: new RegExp(department) }).click();
    await expect(page.getByTestId("auto-split-hint")).toBeVisible();
    await page.getByRole("button", { name: "Resolve Transaction" }).click();
    await expect(page.getByRole("heading", { name: "Resolve Unmatched Transaction" })).toBeHidden({ timeout: 15_000 });
  },
);

Then(
  "the member's {int} is filed as {int} to {string} and {int} to {string} in {string}",
  async ({ backend, world }, _total: number, a1: number, purpose1: string, a2: number, purpose2: string, code: string) => {
    const token = await backend.tokenFor(world.seed!.people.admin.phone);
    await expect.poll(async () => {
      const result = await backend.graphql(
        `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status purposeName category { code } } }`,
        { p: world.seed!.people.member.phone }, token);
      return (result.data?.myContributions ?? [])
        .filter((c: { status: string; category: { code: string } }) => c.status === "completed" && c.category.code === code)
        .map((c: { amount: string; purposeName: string }) => `${c.purposeName}:${Number(c.amount)}`)
        .sort();
    }).toEqual([`${purpose1}:${a1}`, `${purpose2}:${a2}`].sort());
  },
);
