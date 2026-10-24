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
