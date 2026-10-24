/**
 * Lane E2E-C: Pay Bill to a campaign code, champions (invite, join, approve),
 * giving through a champion, the leaderboard, the champion dashboard and the
 * champion digest SMS.
 *
 * Step texts mention "Pay Bill", "champion" or "Roof"-style campaign wording
 * so they never clash with the other lanes' steps.
 */

import { Page } from "@playwright/test";
import { Given, Then, When, expect } from "../support/fixtures";
import type { World } from "../support/fixtures";
import type { Backend } from "../support/backend";
import { signInThroughUi } from "../support/session";
import { ChampionDesk, kes } from "../support/champions";

// One desk per scenario (the world is fresh per scenario), so tokens are reused within it.
const desks = new WeakMap<World, ChampionDesk>();
function desk(backend: Backend, world: World): ChampionDesk {
  if (!world.seed) throw new Error("the church is not set up yet");
  if (!desks.has(world)) desks.set(world, new ChampionDesk(backend, world.seed));
  return desks.get(world)!;
}

function campaign(world: World) {
  const { campaignId, campaignSlug, campaignTitle, campaignCode } = world.values;
  if (!campaignId) throw new Error("no champion campaign was set up in this scenario");
  return { id: campaignId, slug: campaignSlug, title: campaignTitle, code: campaignCode };
}

/** A role key from the seed ("member", "member2", …) or a literal phone. */
function phoneFor(world: World, who: string): string {
  return world.seed!.people[who]?.phone ?? who;
}

async function openPublicCampaignPage(page: Page, slug: string) {
  await page.goto(`/campaigns/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

// ── set-up ────────────────────────────────────────────────────────────────

Given(
  "the approved campaign {string} takes champions under Pay Bill code {string}",
  async ({ backend, world }, title: string, code: string) => {
    const created = await desk(backend, world).approvedChampionCampaign(title, code);
    Object.assign(world.values, {
      campaignId: created.id,
      campaignSlug: created.slug,
      campaignTitle: created.title,
      campaignCode: created.code,
    });
  },
);

Given(
  "the {word} holds Welfare number {string} for Pay Bill",
  async ({ backend, world }, role: string, identifier: string) => {
    await desk(backend, world).giveWelfareNumber(role, identifier);
  },
);

// ── Pay Bill ──────────────────────────────────────────────────────────────

When(
  "the {word} sends KES {int} from the M-Pesa menu to Pay Bill account {string}",
  async ({ backend, world }, who: string, amount: number, account: string) => {
    world.smsMark = await backend.lastSmsId();
    await backend.paybill(phoneFor(world, who), String(amount), account);
  },
);

When(
  "a visitor on {string} named {string} sends KES {int} from the M-Pesa menu to Pay Bill account {string}",
  async ({ backend, world }, phone: string, firstName: string, amount: number, account: string) => {
    world.smsMark = await backend.lastSmsId();
    await backend.paybill(phone, String(amount), account, firstName);
  },
);

Then(
  "the {word}'s Pay Bill receipt SMS says {string}",
  async ({ backend, world }, who: string, text: string) => {
    await backend.expectSms(phoneFor(world, who), [text], world.smsMark);
  },
);

// ── campaign totals ───────────────────────────────────────────────────────

Then("the Pay Bill campaign has raised KES {int} on its public page", async ({ page, world }, amount: number) => {
  await openPublicCampaignPage(page, campaign(world).slug);
  // The band (phones) or the give panel (wide screens) shows it; whichever is visible.
  const progress = page.locator('[data-slot="campaign-progress"]:visible').first();
  await expect(progress).toContainText(`${kes(amount)} of`);
});

Then("staff see KES {int} raised for the Pay Bill campaign", async ({ backend, world }, amount: number) => {
  await expect.poll(() => desk(backend, world).raised(campaign(world).id)).toBe(amount);
});

Then(
  "staff see {string} on the Pay Bill campaign's contributor list",
  async ({ backend, world }, name: string) => {
    await expect.poll(() => desk(backend, world).contributorListText(campaign(world).id)).toContain(name);
  },
);

Then(
  "the treasurer sees {string} in the Pay Bill campaign's share list",
  async ({ page, backend, world }, name: string) => {
    await signInThroughUi(page, backend, world.seed!.people.treasurer.phone);
    await page.goto(`/admin/campaigns/${campaign(world).id}?tab=share`);
    await expect(page.getByTestId("whatsapp-preview")).toContainText(name);
  },
);

Then(
  "staff see a KES {int} {word} Pay Bill gift from {string} with Welfare number {string}",
  async ({ backend, world }, amount: number, department: string, name: string, identifier: string) => {
    await expect
      .poll(async () =>
        (await desk(backend, world).staffContributions()).some(
          (c) =>
            Number.parseFloat(c.amount) === amount &&
            c.category.code === department &&
            c.member.fullName === name &&
            c.departmentMemberIdentifier === identifier,
        ),
      )
      .toBe(true);
  },
);

Then(
  "staff see a KES {int} {word} Pay Bill gift from {string}",
  async ({ backend, world }, amount: number, department: string, name: string) => {
    await expect
      .poll(async () =>
        (await desk(backend, world).staffContributions()).some(
          (c) => Number.parseFloat(c.amount) === amount && c.category.code === department && c.member.fullName === name,
        ),
      )
      .toBe(true);
  },
);

// ── signing in as someone else in the same browser ────────────────────────

/** Signs out whoever is signed in (tokens live in localStorage), then signs `role` in. */
async function signInAs(page: Page, backend: Backend, world: World, role: string) {
  await page.context().clearCookies();
  if (page.url().startsWith("http")) await page.evaluate(() => window.localStorage.clear());
  await signInThroughUi(page, backend, phoneFor(world, role));
}

When("the {word} signs in to look after champions", async ({ page, backend, world }, role: string) => {
  await signInAs(page, backend, world, role);
});

// ── Champions tab (staff) ─────────────────────────────────────────────────

async function openChampionsTab(page: Page, world: World) {
  await page.goto(`/admin/campaigns/${campaign(world).id}?tab=champions`);
  await expect(page.getByRole("button", { name: "Invite a champion" })).toBeEnabled();
}

When(
  "staff invite the {word} as champion {string} on the campaign's Champions tab",
  async ({ page, world }, role: string, code: string) => {
    await openChampionsTab(page, world);
    await page.getByRole("button", { name: "Invite a champion" }).click();
    const dialog = page.getByRole("dialog", { name: "Invite a champion" });
    await dialog.locator("#phoneNumber").fill(phoneFor(world, role).replace(/^254/, ""));
    await dialog.locator("#invite-champion-code").fill(code);
    await expect(dialog).toContainText(`Givers will use M-Pesa account ${campaign(world).code} ${code}.`);
    await dialog.getByRole("button", { name: "Invite", exact: true }).click();
    await expect(dialog).toBeHidden();
  },
);

When("staff approve champion {string} on the Champions tab", async ({ page, world }, code: string) => {
  await openChampionsTab(page, world);
  const row = page.getByRole("table", { name: "Champions" }).getByRole("row").filter({ hasText: code });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByTestId("champion-status")).toHaveText("Active");
});

Then(
  "the Champions tab lists {string} with code {string} as {string}",
  async ({ page, world }, name: string, code: string, status: string) => {
    if (!page.url().includes(`/admin/campaigns/${campaign(world).id}`)) await openChampionsTab(page, world);
    const row = page.getByRole("row", { name, exact: true });
    await expect(row.getByRole("cell").nth(1)).toHaveText(code);
    await expect(row.getByTestId("champion-status")).toHaveText(status);
  },
);

// ── /champion (members) ───────────────────────────────────────────────────

When(
  "they ask to champion the Pay Bill campaign with code {string}",
  async ({ page, world }, code: string) => {
    await page.goto("/champion");
    await page.getByRole("button", { name: "Become a champion" }).click();
    const dialog = page.getByRole("dialog", { name: "Become a champion" });
    await dialog.locator("#champion-campaign").click();
    await page.getByRole("option", { name: campaign(world).title }).click();
    await dialog.locator("#champion-code").fill(code);
    await expect(dialog).toContainText(`Givers will use M-Pesa account ${campaign(world).code} ${code}.`);
    await dialog.getByRole("button", { name: "Send request" }).click();
    await expect(dialog.getByText("Waiting for approval")).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();
  },
);

Then(
  "their champion pages show code {string} as {string}",
  async ({ page }, code: string, status: string) => {
    if (!page.url().endsWith("/champion")) await page.goto("/champion");
    const card = page.getByRole("list", { name: "My champion pages" }).getByRole("listitem").filter({ hasText: `Code ${code}` });
    await expect(card.getByTestId("champion-status")).toHaveText(status);
  },
);

// ── giving through a champion ─────────────────────────────────────────────

Given(
  "staff have made the {word} champion {string} of the Pay Bill campaign",
  async ({ backend, world }, role: string, code: string) => {
    const champion = await desk(backend, world).inviteChampion(campaign(world).id, phoneFor(world, role), code);
    world.values[`champion:${code}`] = champion.id;
  },
);

Then(
  "staff see KES {int} raised through champion {string} from {int} donor(s)",
  async ({ backend, world }, amount: number, code: string, donors: number) => {
    await expect
      .poll(async () => {
        const champion = await desk(backend, world).champion(campaign(world).id, code);
        return [Number.parseFloat(champion.raised), champion.donorCount];
      })
      .toEqual([amount, donors]);
  },
);

When("a visitor opens champion {string}'s page", async ({ page, world }, code: string) => {
  await page.goto(`/campaigns/${campaign(world).slug}/c/${code}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Raised by");
});

Then("the champion page is headed {string}", async ({ page }, heading: string) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
});

Then("the champion page tells givers {string}", async ({ page }, notice: string) => {
  await expect(page.getByTestId("champion-visibility-notice")).toHaveText(notice);
});

Then("the champion page shows the Pay Bill account {string}", async ({ page }, account: string) => {
  await expect(page.getByTestId("paybill-account")).toHaveText(account);
});

When(
  "they give KES {int} through the champion page from {string}",
  async ({ page, backend, world }, amount: number, phone: string) => {
    const card = page.locator("#give");
    await card.locator("#phoneNumber").fill(phone.replace(/^254/, ""));
    await card.locator("#campaign-amount").fill(String(amount));
    world.smsMark = await backend.lastSmsId();
    await card.getByRole("button", { name: "Send M-Pesa prompt" }).click();
    await page.waitForURL(/\/confirmation/);
    world.values.stkPhone = phone;
  },
);

Then("the M-Pesa prompt on {string} is for account {string}", async ({ backend }, phone: string, account: string) => {
  await expect
    .poll(async () => (await backend.stkRequests(phone)).map((r) => r.accountReference))
    .toContain(account);
});

When("they approve the champion gift's M-Pesa prompt on their phone", async ({ backend, world }) => {
  await backend.respondToStk(world.values.stkPhone, "pay");
});

Then(
  "the champion page shows {string} raised from {string}",
  async ({ page }, raised: string, donors: string) => {
    const totals = page.getByTestId("champion-totals");
    await expect(async () => {
      await page.reload();
      await expect(totals).toContainText(raised, { timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await expect(totals).toContainText(donors);
  },
);

Then(
  "{string} gets a receipt SMS saying {string} and {string}",
  async ({ backend, world }, who: string, first: string, second: string) => {
    await backend.expectSms(phoneFor(world, who), [first, second], world.smsMark);
  },
);

// ── leaderboard ───────────────────────────────────────────────────────────

Then("the campaign page's champion leaderboard reads:", async ({ page, world }, table: { hashes(): Record<string, string>[] }) => {
  await openPublicCampaignPage(page, campaign(world).slug);
  const rows = page.getByRole("list", { name: "Top champions" }).getByRole("listitem");
  const expected = table.hashes();
  await expect(rows).toHaveCount(expected.length);
  for (const [i, row] of expected.entries()) {
    const item = rows.nth(i);
    await expect(item.getByLabel(`Rank ${row.rank}`)).toBeVisible();
    await expect(item.getByRole("link")).toHaveText(row.champion);
    await expect(item).toContainText(row.raised);
    await expect(item).toContainText(row.donors);
  }
});

Then("no donor name appears on the public campaign or champion pages:", async ({ page, world }, table: { raw(): string[][] }) => {
  const names = table.raw().flat();
  const { slug } = campaign(world);
  await openPublicCampaignPage(page, slug);
  const leaderboard = page.getByRole("list", { name: "Top champions" });
  const championPaths = await leaderboard.getByRole("link").evaluateAll(
    (links) => links.map((a) => (a as HTMLAnchorElement).getAttribute("href")!),
  );
  // Each page is read once what it loads client-side has arrived.
  const pages: [string, () => Promise<void>][] = [
    [`/campaigns/${slug}`, () => expect(leaderboard).toBeVisible()],
    ["/campaigns", () => expect(page.getByText(campaign(world).title).first()).toBeVisible()],
    ...championPaths.map((path): [string, () => Promise<void>] => [
      path,
      () => expect(page.getByTestId("champion-totals")).toBeVisible(),
    ]),
  ];
  expect(championPaths.length).toBeGreaterThan(0);
  for (const [path, loaded] of pages) {
    await page.goto(path);
    await loaded();
    const text = await page.locator("body").innerText();
    for (const name of names) expect(text, `${name} is shown on ${path}`).not.toContain(name);
  }
});
