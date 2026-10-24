/**
 * Helpers for the pledge journeys (lane E2E-B).
 *
 * Setup shortcuts go through the real GraphQL API the way a client would
 * (campaign creation is lane E2E-A's subject, so it is only a shortcut here).
 * `backdatePledgeDue` moves a due date into the past through /e2e/ (the product
 * refuses past due dates, so an overdue pledge cannot be made any other way).
 */

import { Page, expect } from "@playwright/test";

import { Backend } from "./backend";
import { World } from "./fixtures";

export interface PledgeCampaign {
  id: string;
  slug: string;
  title: string;
  code: string;
}

const campaignsOf = (world: World): Record<string, PledgeCampaign> =>
  ((world as World & { pledgeCampaigns?: Record<string, PledgeCampaign> }).pledgeCampaigns ??= {});

/** An access token per seeded role, fetched once per scenario (each one costs an SMS). */
export async function tokenOf(backend: Backend, world: World, role: string): Promise<string> {
  const key = `token:${role}`;
  if (!world.values[key]) {
    const person = world.seed!.people[role];
    if (!person) throw new Error(`no seeded person "${role}"`);
    world.values[key] = await backend.tokenFor(person.phone);
  }
  return world.values[key];
}

function ok(result: { data?: Record<string, { success: boolean; message: string }>; errors?: unknown }, field: string) {
  if (result.errors) throw new Error(`${field}: ${JSON.stringify(result.errors)}`);
  const payload = result.data?.[field];
  if (!payload?.success) throw new Error(`${field} refused: ${payload?.message}`);
  return payload as unknown as Record<string, unknown>;
}

/** A live campaign taking pledges: created and submitted by the treasurer, approved by the admin. */
export async function createPledgeCampaign(
  backend: Backend,
  world: World,
  title: string,
  code: string,
  department = "BLDG",
): Promise<PledgeCampaign> {
  const treasurer = await tokenOf(backend, world, "treasurer");
  const admin = await tokenOf(backend, world, "admin");
  const created = ok(
    await backend.graphql(
      `mutation($input: CampaignInput!) { createCampaign(input: $input) { success message campaign { id slug title paybillCode } } }`,
      {
        input: {
          title,
          categoryId: String(world.seed!.departments[department].id),
          targetAmount: "500000",
          paybillCode: code,
          summary: `${title}: help us get there.`,
          isPublic: true,
          allowPledges: true,
        },
      },
      treasurer,
    ),
    "createCampaign",
  ).campaign as { id: string; slug: string; title: string; paybillCode: string };
  ok(
    await backend.graphql(`mutation($id: ID!) { submitCampaign(id: $id) { success message } }`, { id: created.id }, treasurer),
    "submitCampaign",
  );
  ok(
    await backend.graphql(`mutation($id: ID!) { approveCampaign(id: $id) { success message } }`, { id: created.id }, admin),
    "approveCampaign",
  );
  const campaign = { id: created.id, slug: created.slug, title: created.title, code: created.paybillCode };
  campaignsOf(world)[title] = campaign;
  return campaign;
}

export function pledgeCampaign(world: World, title: string): PledgeCampaign {
  const campaign = campaignsOf(world)[title];
  if (!campaign) throw new Error(`no campaign "${title}" was set up in this scenario`);
  return campaign;
}

/** The seeded person whose full name is `name`. */
export function personNamed(world: World, name: string) {
  const entry = Object.entries(world.seed!.people).find(([, p]) => p.name === name);
  if (!entry) throw new Error(`no seeded person named "${name}"`);
  return { key: entry[0], ...entry[1] };
}

/** A member's own pledge through createPledge (the API My pledges uses). Returns its id. */
export async function pledgeThroughApi(
  backend: Backend,
  world: World,
  role: string,
  input: { amount: string; campaignId?: string; categoryId?: string; dueDate?: string | null },
): Promise<string> {
  const token = await tokenOf(backend, world, role);
  const result = ok(
    await backend.graphql(
      `mutation($input: PledgeInput!) { createPledge(input: $input) { success message pledge { id } } }`,
      { input },
      token,
    ),
    "createPledge",
  );
  return (result.pledge as { id: string }).id;
}

/** YYYY-MM-DD in Nairobi, `days` from today. */
export function nairobiDate(days = 0): string {
  const now = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(now);
}

/** "27 Oct 2026", the way reminder SMS write dates (strftime %d %b %Y). */
export function smsDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${String(d).padStart(2, "0")} ${month} ${y}`;
}

/** Move a pledge's due date into the past, straight in the e2e SQLite database. */
/** Make a pledge overdue by moving its due date (through /e2e/pledge/backdate/). */
export async function backdatePledgeDue(backend: Backend, pledgeId: string, isoDate: string) {
  await backend.backdatePledge(pledgeId, isoDate);
}

// ── the screens ────────────────────────────────────────────────────────────

/** Pick `option` in a shadcn (Radix) select whose trigger has id `triggerId`. */
export async function chooseInSelect(page: Page, triggerId: string, option: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.locator(`#${triggerId}`)).toContainText(option);
}

/** One of My pledges' cards: its target and the pledged amount (e.g. "KES 3,000.00"). */
export function myPledgeCard(page: Page, target: string, pledged: string) {
  return page
    .getByRole("article", { name: `Pledge to ${target}` })
    .filter({ has: page.locator(`xpath=.//dl/div[1]/dd[normalize-space(.)="${pledged}"]`) });
}

/** A figure ("Pledged", "Paid", "Balance") on a My pledges card or totals bar. */
export function figure(scope: ReturnType<Page["locator"]>, label: string) {
  return scope.locator(`xpath=.//dt[normalize-space(.)="${label}"]/following-sibling::dd[1]`);
}

/** The register's desktop table rows for `name` (the phone cards are hidden at this width). */
export function registerRows(page: Page, name?: string) {
  const rows = page.locator("table tbody tr");
  return name ? rows.filter({ has: page.locator("td").first().getByText(name, { exact: true }) }) : rows;
}

/** A register cell by column header ("Pledged", "Paid", "Balance", "Status", "Source", …). */
export async function registerCell(page: Page, row: ReturnType<Page["locator"]>, header: string) {
  const headers = (await page.locator("table thead th").allInnerTexts()).map((h) => h.trim());
  const index = headers.indexOf(header);
  if (index < 0) throw new Error(`no register column "${header}" in ${JSON.stringify(headers)}`);
  return row.locator("td").nth(index);
}
