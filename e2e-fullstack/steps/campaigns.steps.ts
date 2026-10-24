/**
 * Lane E2E-A (Campaigns): create, submit and four-eyes approval; public list
 * and page (totals only); give by M-Pesa prompt (pay and cancel); the
 * confirmation share card; receipt lines; department-admin scope; updates
 * with donor SMS; the WhatsApp contributor list.
 *
 * Step texts are phrased around campaigns so they never clash with other lanes.
 */

import type { DataTable } from "playwright-bdd";
import { Page } from "@playwright/test";
import { Given, Then, When, expect } from "../support/fixtures";
import {
  campaignAsStaff,
  campaignThroughApi,
  giftByPrompt,
  kes,
  knownCampaign,
  refOf,
  rememberCampaign,
  seededPerson,
  switchUserInBrowser,
  tokenOf,
  departmentId,
} from "../support/campaigns";

const SLOW = { timeout: 30_000 };
const WHATSAPP_NOTICE = "Contributors to this campaign are listed by name and amount in the church WhatsApp group.";
const FOUR_EYES_MESSAGE = "Only an admin or pastor who did not create the campaign may approve it.";

function statusBadge(page: Page) {
  return page.getByTestId("campaign-status");
}

async function openAdminCampaign(page: Page, id: string, tab?: string) {
  await page.goto(`/admin/campaigns/${id}${tab ? `?tab=${tab}` : ""}`);
}

// ── Setup shortcuts (the story under test is not the setup) ─────────────────

Given(
  "the campaign {string} with code {string} is still a draft",
  async ({ backend, world }, title: string, code: string) => {
    await campaignThroughApi(backend, world, { title, code, stage: "draft" });
  },
);

Given(
  "the campaign {string} with code {string} is awaiting approval",
  async ({ backend, world }, title: string, code: string) => {
    await campaignThroughApi(backend, world, { title, code, stage: "submitted" });
  },
);

Given(
  "the campaign {string} with code {string} has been approved",
  async ({ backend, world }, title: string, code: string) => {
    await campaignThroughApi(backend, world, { title, code, stage: "approved" });
  },
);

Given(
  "the campaign {string} with code {string} and a target of {int} has been approved",
  async ({ backend, world }, title: string, code: string, target: number) => {
    await campaignThroughApi(backend, world, { title, code, target: String(target), stage: "approved" });
  },
);

Given(
  "the admin has drafted and submitted the campaign {string} with code {string}",
  async ({ backend, world }, title: string, code: string) => {
    const admin = await tokenOf(backend, world, "admin");
    const created = await backend.graphql(
      `mutation($input: CampaignInput!) {
         createCampaign(input: $input) { success message campaign { id slug title paybillCode categoryId purposeId } }
       }`,
      {
        input: {
          title,
          categoryId: departmentId(world, "Building Fund"),
          targetAmount: "300000",
          paybillCode: code,
          isPublic: true,
          allowPledges: true,
          allowChampions: false,
        },
      },
      admin,
    );
    expect(created.data.createCampaign.success, created.data.createCampaign.message).toBe(true);
    const campaign = refOf(created.data.createCampaign.campaign);
    const submitted = await backend.graphql(
      `mutation($id: ID!) { submitCampaign(id: $id) { success message } }`,
      { id: campaign.id },
      admin,
    );
    expect(submitted.data.submitCampaign.success, submitted.data.submitCampaign.message).toBe(true);
    rememberCampaign(world, campaign);
  },
);

Given(
  "the {word} has given KES {int} to {string} by M-Pesa prompt",
  async ({ backend, world }, key: string, amount: number, title: string) => {
    await giftByPrompt(backend, knownCampaign(world, title), seededPerson(world, key).phone, String(amount));
  },
);

// ── Story 1 and 5: the campaign form, submit and approval ───────────────────

When("I open the new campaign form", async ({ page }) => {
  await page.goto("/admin/campaigns");
  await page.getByRole("link", { name: "New campaign" }).first().click();
  await expect(page).toHaveURL(/\/admin\/campaigns\/new/);
  await expect(page.getByLabel("Title")).toBeVisible();
});

When(
  "I draft the campaign {string} for {string} with code {string} and a target of {int} in the campaign form",
  async ({ page, backend, world }, title: string, department: string, code: string, target: number) => {
    if (!/\/admin\/campaigns\/new/.test(page.url())) {
      await page.goto("/admin/campaigns/new");
    }
    await page.locator("#campaign-title").fill(title);
    await page.locator("#campaign-department").click();
    await page.getByRole("option", { name: department, exact: true }).click();
    await page.locator("#campaign-target").fill(String(target));
    await page.locator("#campaign-code").fill(code);
    await page.locator("#campaign-summary").fill(`Help us with ${title}`);
    await page.locator("#campaign-story").fill(`${title} is a project of the church.`);
    await page.getByRole("button", { name: "Save as draft" }).click();
    await expect(page).toHaveURL(/\/admin\/campaigns\/\d+/, SLOW);
    const id = page.url().match(/\/admin\/campaigns\/(\d+)/)![1];
    const token = await tokenOf(backend, world, "admin");
    const result = await backend.graphql(
      `query($id: ID!) { campaign(id: $id) { id slug title paybillCode categoryId purposeId } }`,
      { id },
      token,
    );
    const campaign = refOf(result.data.campaign);
    expect(campaign.title).toBe(title);
    expect(campaign.code).toBe(code);
    rememberCampaign(world, campaign);
  },
);

When("I open the admin page of the campaign {string}", async ({ page, world }, title: string) => {
  await openAdminCampaign(page, knownCampaign(world, title).id);
});

Then("the campaign overview shows the status {string}", async ({ page }, status: string) => {
  await expect(statusBadge(page)).toHaveText(status, SLOW);
});

When("I submit the campaign for approval", async ({ page }) => {
  await page.getByRole("button", { name: "Submit for approval" }).click();
});

Then("the campaign overview explains the four-eyes rule", async ({ page }) => {
  await expect(page.getByText(/whoever created a\s+campaign cannot approve it \(four-eyes rule\)/)).toBeVisible();
});

Then("the campaign overview offers no way to approve it", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Return to draft" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
});

When(
  "the pastor signs in and approves the campaign {string}",
  async ({ page, backend, world }, title: string) => {
    await switchUserInBrowser(page, backend, world, "pastor");
    await openAdminCampaign(page, knownCampaign(world, title).id);
    await expect(statusBadge(page)).toHaveText("Awaiting approval", SLOW);
    await page.getByRole("button", { name: "Approve", exact: true }).click();
  },
);

Then("the campaign overview says it was approved by {string}", async ({ page }, name: string) => {
  const approvedBy = page.locator("dt", { hasText: "Approved by" }).locator("xpath=following-sibling::dd[1]");
  await expect(approvedBy).toContainText(name, SLOW);
});

Then(
  "the backend refuses the admin's approval of {string} with the four-eyes message",
  async ({ backend, world }, title: string) => {
    const admin = await tokenOf(backend, world, "admin");
    const result = await backend.graphql(
      `mutation($id: ID!) { approveCampaign(id: $id) { success message campaign { status } } }`,
      { id: knownCampaign(world, title).id },
      admin,
    );
    expect(result.data.approveCampaign.success).toBe(false);
    expect(result.data.approveCampaign.message).toBe(FOUR_EYES_MESSAGE);
    const after = await campaignAsStaff(backend, world, knownCampaign(world, title).id);
    expect(after.status).toBe("PENDING_APPROVAL");
  },
);

Then("the campaign form offers only the department {string}", async ({ page }, department: string) => {
  await page.locator("#campaign-department").click();
  const options = page.getByRole("option");
  await expect(options).toHaveText([department], SLOW);
  await page.keyboard.press("Escape");
});

Then(
  "the backend refuses the {word} a {string} campaign",
  async ({ backend, world }, key: string, department: string) => {
    const token = await tokenOf(backend, world, key);
    const result = await backend.graphql(
      `mutation($input: CampaignInput!) { createCampaign(input: $input) { success message } }`,
      {
        input: {
          title: "Not my department",
          categoryId: departmentId(world, department),
          targetAmount: "1000",
          paybillCode: "NOTMINE",
        },
      },
      token,
    );
    const refused = result.errors?.length > 0 || result.data?.createCampaign?.success === false;
    expect(refused, JSON.stringify(result)).toBe(true);
  },
);

// ── Story 2 and 3: the public list and page ─────────────────────────────────

When("a visitor opens the public campaigns list", async ({ page }) => {
  await page.goto("/campaigns");
  await expect(page.getByRole("heading", { name: "Campaigns", level: 1 })).toBeVisible();
});

function publicCard(page: Page, title: string) {
  return page.locator('[data-slot="public-campaign-card"]').filter({ has: page.getByRole("link", { name: title }) });
}

Then("the public campaigns list shows {string}", async ({ page }, title: string) => {
  await expect(publicCard(page, title)).toBeVisible(SLOW);
});

Then("the public campaigns list does not show {string}", async ({ page }, title: string) => {
  // The list has loaded once at least one card (or the empty state) is shown.
  await expect(page.locator('[data-slot="public-campaign-card"]').first()).toBeVisible(SLOW);
  await expect(page.getByText(title)).toHaveCount(0);
});

Then(
  "the public campaigns list shows {string} with KES {int} raised from {int} donors",
  async ({ page }, title: string, raised: number, donors: number) => {
    const card = publicCard(page, title);
    await expect(card).toContainText(kes(raised), SLOW);
    await expect(card).toContainText(`${donors} donors`);
  },
);

When("a visitor opens the public page of the campaign {string}", async ({ page, world }, title: string) => {
  await page.goto(`/campaigns/${knownCampaign(world, title).slug}`);
});

When(
  "a visitor opens the contribute page for the campaign {string}",
  async ({ page, world }, title: string) => {
    await page.goto(`/contribute?campaign=${knownCampaign(world, title).slug}`);
  },
);

Then("the visitor is told the campaign cannot be found", async ({ page }) => {
  await expect(page.getByText("We couldn't find that campaign")).toBeVisible(SLOW);
});

Then("the public campaign page is titled {string}", async ({ page }, title: string) => {
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible(SLOW);
});

function progressBlock(page: Page) {
  // The page shows the totals in the give panel (wide screens) and in a band
  // for phones; on this desktop viewport the give panel's is the visible one.
  return page.locator('[data-slot="campaign-progress"]').filter({ visible: true }).first();
}

Then(
  "the public campaign page shows KES {int} raised of KES {int} at {int}% from {int} donors",
  async ({ page }, raised: number, target: number, percent: number, donors: number) => {
    const progress = progressBlock(page);
    await expect(progress).toContainText(kes(raised), SLOW);
    await expect(progress).toContainText(`of ${kes(target)}`);
    await expect(progress).toContainText(`${percent}%`);
    await expect(progress).toContainText(`${donors} donors`);
  },
);

async function expectNoDonorNames(page: Page, world: Parameters<typeof seededPerson>[0]) {
  await expect(progressBlock(page)).toBeVisible(SLOW);
  const text = await page.locator("body").innerText();
  for (const key of ["member", "member2"]) {
    const person = seededPerson(world, key);
    for (const part of person.name.split(" ")) expect(text).not.toContain(part);
    expect(text).not.toContain(person.phone);
    expect(text).not.toContain(person.phone.slice(3));
  }
}

Then("the public campaign page names none of the donors", async ({ page, world }) => {
  await expectNoDonorNames(page, world);
});

Then("the public campaigns list names none of the donors", async ({ page, world }) => {
  await expectNoDonorNames(page, world);
});

Then(
  /^the public page of "(.+)" shows KES (\d+) raised from (\d+) donors?$/,
  async ({ page, world }, title: string, raised: string, donors: string) => {
    await page.goto(`/campaigns/${knownCampaign(world, title).slug}`);
    const progress = progressBlock(page);
    await expect(progress).toContainText(kes(raised), SLOW);
    const n = Number(donors);
    await expect(progress).toContainText(`${n} ${n === 1 ? "donor" : "donors"}`);
  },
);

// ── Story 4: giving by M-Pesa prompt ────────────────────────────────────────

When(
  "the visitor asks the campaign give panel for an M-Pesa prompt of KES {int} to {string}",
  async ({ page }, amount: number, phone: string) => {
    const panel = page.locator('[data-slot="campaign-give-panel"]');
    await expect(panel).toBeVisible(SLOW);
    // Typed key by key, as a person does: the field drops the leading 0 as it
    // goes (pasting a 10-digit 07… number hits its 9-character limit first).
    await panel.locator("#phoneNumber").pressSequentially(phone);
    await panel.locator("#campaign-amount").fill(String(amount));
    await panel.getByRole("button", { name: "Send M-Pesa prompt" }).click();
    await expect(page).toHaveURL(/\/confirmation\?/, SLOW);
  },
);

Then(
  "an M-Pesa prompt for KES {int} went to {string} with the campaign code {string} as the account",
  async ({ backend }, amount: number, phone: string, code: string) => {
    await expect
      .poll(async () => (await backend.stkRequests(phone)).length, { message: `no prompt to ${phone}` })
      .toBe(1);
    const [prompt] = await backend.stkRequests(phone);
    expect(prompt.accountReference).toBe(code);
    expect(Number(prompt.amount)).toBe(amount);
    expect(prompt.state).toBe("pending");
  },
);

When(
  "the visitor pays the campaign prompt on {string} and Safaricom echoes the Pay Bill payment",
  async ({ backend, world }, phone: string) => {
    world.smsMark = await backend.lastSmsId();
    const answer = await backend.respondToStk(phone, "pay", true);
    expect(answer.callbackStatus).toBe(200);
    expect(answer.echo).toBe(200);
    world.values.mpesaReceipt = String(answer.mpesaReceipt);
  },
);

When("the visitor cancels the campaign prompt on {string}", async ({ backend, world }, phone: string) => {
  world.smsMark = await backend.lastSmsId();
  const answer = await backend.respondToStk(phone, "cancel");
  expect(answer.callbackStatus).toBe(200);
});

Then("the campaign confirmation page says the payment was successful", async ({ page }) => {
  await expect(page.getByText("Payment Successful!")).toBeVisible({ timeout: 45_000 });
});

Then("the campaign confirmation page says the payment failed", async ({ page }) => {
  await expect(page.getByText("Payment Failed")).toBeVisible({ timeout: 45_000 });
});

Then(
  "the campaign confirmation page invites the giver to share {string}",
  async ({ page }, title: string) => {
    const card = page.locator('[data-slot="campaign-share-card"]');
    await expect(card.getByRole("heading", { name: "Share this campaign" })).toBeVisible(SLOW);
    await expect(card).toContainText(title);
  },
);

Then(
  "{string} gets a campaign receipt SMS saying {string} with the WhatsApp list notice",
  async ({ backend, world }, phone: string, towards: string) => {
    await backend.expectSms(phone, [towards, WHATSAPP_NOTICE], world.smsMark);
  },
);

Then(
  "{string} counted {int} gift of KES {int}, not the Pay Bill echo as well",
  async ({ backend, world }, title: string, gifts: number, amount: number) => {
    const campaign = await campaignAsStaff(backend, world, knownCampaign(world, title).id);
    expect(campaign.progress.giftCount).toBe(gifts);
    expect(Number(campaign.progress.raised)).toBe(amount);
  },
);

Then("{string} counted no gifts", async ({ backend, world }, title: string) => {
  const campaign = await campaignAsStaff(backend, world, knownCampaign(world, title).id);
  expect(campaign.progress.giftCount).toBe(0);
  expect(Number(campaign.progress.raised)).toBe(0);
});

// ── Story 6: updates and the donor SMS ──────────────────────────────────────

When(
  "I open the {string} tab of the campaign {string}",
  async ({ page, world }, tab: string, title: string) => {
    await openAdminCampaign(page, knownCampaign(world, title).id);
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
  },
);

When(
  "I post the campaign update {string} saying {string} and also SMS everyone who has given",
  async ({ page, backend, world }, title: string, body: string) => {
    world.smsMark = await backend.lastSmsId();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Post update" }) });
    await form.getByLabel("Title").fill(title);
    await form.getByLabel("Message").fill(body);
    await form.getByLabel("Also SMS everyone who has given").check();
    await form.getByRole("button", { name: "Post update" }).click();
    await expect(form.getByLabel("Title")).toHaveValue("", SLOW);
  },
);

Then(
  "the public page of {string} shows the update {string} saying {string}",
  async ({ page, world }, campaignTitle: string, title: string, body: string) => {
    await page.goto(`/campaigns/${knownCampaign(world, campaignTitle).slug}`);
    const updates = page.locator('[data-slot="campaign-updates"]');
    await expect(updates.getByRole("heading", { name: title })).toBeVisible(SLOW);
    await expect(updates).toContainText(body);
  },
);

async function updateSmsTo(backend: Parameters<typeof giftByPrompt>[0], phone: string, after: number, title: string) {
  return (await backend.outbox(phone, after)).filter((m) => m.body.includes(`: ${title}.`));
}

Then(
  "the {word} gets exactly one SMS about the campaign update {string}",
  async ({ backend, world }, key: string, title: string) => {
    const phone = seededPerson(world, key).phone;
    await backend.expectSms(phone, [`Church Roof 2026: ${title}.`, "/campaigns/"], world.smsMark);
    // Give any duplicate a moment to arrive before counting.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(await updateSmsTo(backend, phone, world.smsMark, title)).toHaveLength(1);
  },
);

Then(
  "nobody who has not given gets an SMS about the campaign update {string}",
  async ({ backend, world }, title: string) => {
    const donors = new Set([seededPerson(world, "member").phone, seededPerson(world, "member2").phone]);
    const all = (await backend.outbox(undefined, world.smsMark)).filter((m) => m.body.includes(`: ${title}.`));
    expect(all.map((m) => m.phone).filter((p) => !donors.has(p))).toEqual([]);
    expect(all).toHaveLength(2);
  },
);

// ── Story 7: the WhatsApp contributor list ──────────────────────────────────

Then(
  "the WhatsApp contributor list shows {int} contributors and KES {int} given",
  async ({ page }, count: number, total: number) => {
    const figures = page.locator("dl").filter({ hasText: "Contributors" });
    await expect(figures).toContainText(`${count} contributors`, SLOW);
    await expect(figures).toContainText(kes(total));
  },
);

Then("the WhatsApp text lists the donors largest first:", async ({ page, world }, table: DataTable) => {
  const preview = page.getByTestId("whatsapp-preview");
  await expect(preview).toBeVisible(SLOW);
  const text = await preview.innerText();
  const lines = text.split("\n").filter((line) => /^\d+\. /.test(line));
  const expected = table.hashes().map((row) => `${row.rank}. ${row.name} – ${row.amount}`);
  expect(lines).toEqual(expected);
  world.values.whatsappText = text;
});

When("I share the contributor list to WhatsApp", async ({ page, world }) => {
  // The browser must not reach the real WhatsApp: answer wa.me locally.
  await page.context().route(/^https:\/\/(api\.)?wa\.me\//, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>WhatsApp</title>" }),
  );
  const recorded = page.waitForResponse(
    (response) =>
      response.url().includes("/graphql") && (response.request().postData() ?? "").includes("recordWhatsappShare"),
  );
  const popup = page.context().waitForEvent("page");
  await page.getByRole("button", { name: "Share list to WhatsApp" }).click();
  const opened = await popup;
  await opened.waitForURL(/wa\.me/, SLOW);
  world.values.whatsappUrl = opened.url();
  await opened.close();
  world.values.shareResponse = JSON.stringify(await (await recorded).json());
});

Then("WhatsApp opens with the contributor list ready to send", async ({ world }) => {
  const url = new URL(world.values.whatsappUrl);
  expect(url.host).toBe("wa.me");
  const text = url.searchParams.get("text") ?? "";
  expect(text).toContain("*Church Roof 2026*");
  expect(text).toContain("1. Mary Wanjiku – 3,000");
  expect(text).toContain("2. John Kamau – 2,000");
  expect(text).toContain("Acc ROOF");
});

Then("the backend records the share of the contributor list", async ({ page, world }) => {
  const response = JSON.parse(world.values.shareResponse);
  expect(response.data.recordWhatsappShare).toMatchObject({ success: true, message: "List share recorded." });
  await expect(page.getByText("List share recorded.")).toBeVisible(SLOW);
});
