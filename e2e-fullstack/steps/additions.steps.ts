/**
 * X-9: the sprint additions end to end (DEPARTMENT_REPORTS/03_ADDITIONS_FUNDS_WHATSAPP.md).
 *
 * US-16/17 fund transfers with four-eyes approval, US-19 moving a gift,
 * US-20/21/23 WhatsApp shout-outs and the intro text, US-24 announcements
 * posted once to the church group.
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { departmentId, seededPerson, switchUserInBrowser } from "../support/campaigns";
import { dismissTours } from "../support/desk";
import {
  KEYS,
  availableBalance,
  moveGiftButton,
  nthPost,
  paymentLines,
  postsTo,
  setChurchGroup,
  transferRow,
} from "../support/additions";

// ── Fund transfers (US-16, US-17) ────────────────────────────────────────
When("I open Fund transfers", async ({ page }) => {
  await page.goto("/admin");
  await page.locator("aside").getByRole("button", { name: "Fund transfers", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/transfers$/);
  await expect(page.getByRole("heading", { name: "Fund transfers", level: 1 })).toBeVisible();
});

When(
  "I request a transfer of {int} from {string} to {string} because {string}",
  async ({ page }, amount: number, from: string, to: string, reason: string) => {
    await page.getByRole("button", { name: "New transfer" }).click();
    const dialog = page.getByRole("dialog", { name: "Move money between funds" });
    await dialog.getByLabel("From department", { exact: true }).selectOption({ label: from });
    await expect(dialog.getByTestId("ft-available")).toHaveText(/Available: KES/);
    await dialog.getByLabel("To department", { exact: true }).selectOption({ label: to });
    await dialog.getByLabel("Amount", { exact: true }).fill(String(amount));
    await dialog.getByLabel("Reason", { exact: true }).fill(reason);
    await dialog.getByRole("button", { name: "Request transfer" }).click();
    await expect(dialog).toBeHidden();
  },
);

Then("the transfer {string} is Requested and I cannot approve it", async ({ page }, reason: string) => {
  const row = transferRow(page, reason);
  await expect(row.getByText("Requested", { exact: true })).toBeVisible();
  await expect(row).toContainText("Requested by Tom Treasurer");
  await expect(row.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(row.getByRole("button", { name: "Approve" })).toHaveCount(0);
});

When("the admin approves the transfer {string}", async ({ page, backend, world }, reason: string) => {
  await switchUserInBrowser(page, backend, world, "admin");
  await page.goto("/admin/transfers");
  await expect(page.getByRole("heading", { name: "Fund transfers", level: 1 })).toBeVisible();
  await transferRow(page, reason).getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Transfer approved")).toBeVisible();
});

Then("the transfer {string} says {string}", async ({ page }, reason: string, text: string) => {
  const row = transferRow(page, reason);
  await expect(row).toContainText(text);
  await expect(row.getByRole("button")).toHaveCount(0);
});

Then(
  "the API shows {string} holds {int} and {string} holds {int}",
  async ({ backend, world }, first: string, firstAmount: number, second: string, secondAmount: number) => {
    expect(await availableBalance(backend, world, first)).toBe(firstAmount);
    expect(await availableBalance(backend, world, second)).toBe(secondAmount);
  },
);

// ── Moving a gift (US-19) ────────────────────────────────────────────────
When(
  "I move the {int} gift from {string} to {string} because {string}",
  async ({ page, world }, amount: number, from: string, to: string, reason: string) => {
    const move = moveGiftButton(page);
    await expect(move).toHaveCount(1, { timeout: 30_000 });
    // The dialog loads the whole payment by its group id: keep it for the API check.
    const linesRequest = page.waitForRequest((r) => r.url().includes("/graphql") && (r.postData() ?? "").includes("GetPaymentLines"));
    await move.click();
    world.values[KEYS.paymentGroup] = (await linesRequest).postDataJSON().variables.contributionGroupId;

    const dialog = page.getByRole("dialog", { name: "Move gift" });
    const department = dialog.getByLabel("Department (line 1)", { exact: true });
    await expect(department).toHaveValue(departmentId(world, from));
    await expect(dialog.getByLabel("Amount (line 1)", { exact: true })).toHaveValue(`${amount}.00`);
    await department.selectOption({ label: to });
    await expect(dialog.getByTestId("move-gift-total")).toHaveText(/^KES ([\d,.]+) of KES \1$/);

    await dialog.getByRole("button", { name: "Preview", exact: true }).click();
    const preview = dialog.getByTestId("move-gift-preview");
    await expect(preview).toContainText(from);
    await expect(preview).toContainText(to);
    await dialog.getByLabel("Reason", { exact: true }).fill(reason);
    await dialog.getByRole("button", { name: "Move gift", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Gift moved")).toBeVisible();
  },
);

Then("the API shows that payment is all in {string} for {int}", async ({ backend, world }, department: string, amount: number) => {
  const lines = await paymentLines(backend, world, world.values[KEYS.paymentGroup]);
  expect(lines).toEqual([{ department, purpose: null, amount: `${amount}.00` }]);
});

// ── WhatsApp posts: church settings, shout-outs, opting out (US-20, US-21, US-23) ──
When("I open Admin → WhatsApp posts", async ({ page }) => {
  await page.goto("/admin");
  await page.locator("aside").getByRole("button", { name: "WhatsApp posts", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/whatsapp-posts$/);
  await expect(page.getByRole("heading", { name: "WhatsApp posts", level: 1 })).toBeVisible();
});

When("I choose the church WhatsApp group {string}", async ({ page }, group: string) => {
  const select = page.getByLabel("Church WhatsApp group", { exact: true });
  await expect(select.locator("option", { hasText: group })).toHaveCount(1);
  await select.selectOption({ label: group });
});

When("I write the intro text {string} and put it first", async ({ page }, text: string) => {
  await page.getByLabel("Intro text", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Move Intro text up", exact: true }).click();
  await expect(page.getByRole("button", { name: "Move Intro text up", exact: true })).toBeDisabled();
  await expect(page.getByTestId("totals-preview")).toContainText(text);
});

When("I save the WhatsApp post settings", async ({ page }) => {
  await page.getByRole("button", { name: "Save", exact: true }).click();
});

Then(
  "after a reload the church WhatsApp group is {string} and the intro is {string}",
  async ({ page }, group: string, text: string) => {
    await page.reload();
    const select = page.getByLabel("Church WhatsApp group", { exact: true });
    await expect(select.locator("option:checked")).toHaveText(group);
    await expect(page.getByLabel("Intro text", { exact: true })).toHaveValue(text);
  },
);

When("I send a test to the group now", async ({ page }) => {
  const button = page.getByRole("button", { name: "Send a test to the group now", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
});

Then(
  "the test post to {string} starts with {string} and tags the {word}",
  async ({ backend, world }, group: string, intro: string, key: string) => {
    const person = seededPerson(world, key);
    const post = await nthPost(backend, group, "totals-test:", 1);
    expect(post.body.startsWith(intro), post.body).toBe(true);
    expect(post.body).toContain(`@${person.phone}`);
    expect(post.body).not.toContain(person.name);
    expect(post.mentions).toEqual([person.phone]);
    expect(post.mention_names).toEqual({ [person.phone]: person.name });
  },
);

When("the {word} switches off WhatsApp tagging in their profile", async ({ page, backend, world }, key: string) => {
  await switchUserInBrowser(page, backend, world, key);
  await dismissTours(backend, page, ["profile_notifications_v1"]);
  await page.goto("/profile/notifications");
  const toggle = page.getByRole("switch", { name: "Tag me in WhatsApp group thank-yous" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(page.getByText("You will no longer be tagged in WhatsApp posts.")).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
});

When("the 23:50 totals post runs", async ({ backend }) => {
  // The 5-minute scheduler, as at the day's final slot (test posts allow one per 10 minutes).
  const result = await backend.runJob("scheduled-totals", { at: "23:50" });
  expect(result.queued).toBeGreaterThanOrEqual(1);
});

Then(
  "the totals post to {string} names the {word} without tagging",
  async ({ backend, world }, group: string, key: string) => {
    const person = seededPerson(world, key);
    const post = await nthPost(backend, group, "totals:", 1);
    expect(post.body).toContain(person.name);
    expect(post.body).not.toContain(`@${person.phone}`);
    expect(post.body).not.toContain(person.phone);
    expect(post.mentions).toEqual([]);
  },
);

// ── Announcements to the church group (US-24) ────────────────────────────
Given("the admin has set the church WhatsApp group to {string}", async ({ backend, world }, group: string) => {
  await setChurchGroup(backend, world, group);
});

When(
  "I create the announcement {string} saying {string}, published now and posted to the church WhatsApp group",
  async ({ page, backend }, title: string, content: string) => {
    await dismissTours(backend, page, ["admin_announcements_v1"]);
    await page.goto("/admin/announcements");
    await page.getByRole("button", { name: "New Announcement", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create New Announcement" });
    await dialog.getByLabel("Title *", { exact: true }).fill(title);
    await dialog.getByLabel("Content *", { exact: true }).fill(content);
    await expect(dialog.getByLabel("Publish Date & Time", { exact: true })).toHaveValue("");
    const post = dialog.getByRole("checkbox", { name: "Post to the church WhatsApp group when it is published" });
    await expect(post).toBeChecked();
    await dialog.getByRole("button", { name: "Create Announcement", exact: true }).click();
    await expect(dialog).toBeHidden();
  },
);

Then("the announcement {string} shows {string}", async ({ page }, title: string, status: string) => {
  await page.reload();
  const badge = page
    .getByTestId("announcement-whatsapp-status")
    .locator("visible=true")
    .filter({ hasText: status });
  await expect(page.getByText(title, { exact: true }).locator("visible=true").first()).toBeVisible();
  await expect(badge).toHaveCount(1);
});

When("the announcements job runs, posting {int}", async ({ backend }, sent: number) => {
  expect((await backend.runJob("announcements")).sent).toBe(sent);
});

Then(
  "the group {string} has exactly {int} post starting with {string}",
  async ({ backend }, group: string, count: number, start: string) => {
    const posts = await postsTo(backend, group);
    expect(posts.filter((p) => p.body.startsWith(start))).toHaveLength(count);
    expect(posts).toHaveLength(count);
  },
);

Then(
  "the post to {string} reads {string}, then {string}, then the church name",
  async ({ backend }, group: string, heading: string, content: string) => {
    const [post] = await postsTo(backend, group);
    expect(post.body).toMatch(new RegExp(`^${escapeRegExp(heading)}\\n\\n${escapeRegExp(content)}\\n\\n— \\S.+$`));
    expect(post.mentions).toEqual([]);
  },
);

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
