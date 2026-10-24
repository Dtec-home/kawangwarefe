/**
 * Campaign helpers for lane E2E-A (Campaigns).
 *
 * Setup shortcuts go through the real GraphQL API with real OTP tokens; they
 * are used only where the story under test is not the setup itself (e.g. an
 * already-approved campaign before a visitor gives to it).
 */

import { Page, expect } from "@playwright/test";
import { Backend } from "./backend";
import type { World } from "./fixtures";
import { signInThroughUi } from "./session";

export interface CampaignRef {
  id: string;
  slug: string;
  title: string;
  code: string;
  categoryId: string;
  purposeId: string | null;
}

/** Campaigns a scenario knows about, by title. Kept on the per-scenario world. */
type CampaignWorld = World & { campaigns?: Record<string, CampaignRef>; tokens?: Record<string, string> };

export function rememberCampaign(world: World, campaign: CampaignRef) {
  const w = world as CampaignWorld;
  w.campaigns = { ...(w.campaigns ?? {}), [campaign.title]: campaign };
}

export function knownCampaign(world: World, title: string): CampaignRef {
  const campaign = (world as CampaignWorld).campaigns?.[title];
  if (!campaign) throw new Error(`the scenario has no campaign "${title}"`);
  return campaign;
}

export function seededPerson(world: World, key: string) {
  const person = world.seed?.people[key];
  if (!person) throw new Error(`no seeded person "${key}"`);
  return person;
}

export function departmentId(world: World, name: string): string {
  const found = Object.values(world.seed?.departments ?? {}).find((d) => d.name === name);
  if (!found) throw new Error(`no seeded department "${name}"`);
  return String(found.id);
}

/** A real access token for a seeded person (one OTP login per scenario). */
export async function tokenOf(backend: Backend, world: World, key: string): Promise<string> {
  const w = world as CampaignWorld;
  w.tokens = w.tokens ?? {};
  if (!w.tokens[key]) w.tokens[key] = await backend.tokenFor(seededPerson(world, key).phone);
  return w.tokens[key];
}

const CAMPAIGN_REF = `id slug title paybillCode categoryId purposeId status`;

export function refOf(campaign: Record<string, unknown>): CampaignRef {
  return {
    id: String(campaign.id),
    slug: String(campaign.slug),
    title: String(campaign.title),
    code: String(campaign.paybillCode),
    categoryId: String(campaign.categoryId),
    purposeId: (campaign.purposeId as string | null) ?? null,
  };
}

async function gqlOk(backend: Backend, query: string, variables: Record<string, unknown>, token?: string) {
  const result = await backend.graphql(query, variables, token);
  expect(result.errors, JSON.stringify(result.errors)).toBeFalsy();
  return result.data;
}

export type CampaignStage = "draft" | "submitted" | "approved";

/** Creates a campaign as the treasurer and moves it to `stage` (the pastor approves). */
export async function campaignThroughApi(
  backend: Backend,
  world: World,
  opts: { title: string; code: string; department?: string; target?: string; stage: CampaignStage },
): Promise<CampaignRef> {
  const treasurer = await tokenOf(backend, world, "treasurer");
  const created = await gqlOk(
    backend,
    `mutation($input: CampaignInput!) { createCampaign(input: $input) { success message campaign { ${CAMPAIGN_REF} } } }`,
    {
      input: {
        title: opts.title,
        categoryId: departmentId(world, opts.department ?? "Building Fund"),
        targetAmount: opts.target ?? "500000",
        paybillCode: opts.code,
        summary: `Help us with ${opts.title}`,
        story: `${opts.title} is a project of the church.`,
        isPublic: true,
        allowPledges: true,
        allowChampions: false,
      },
    },
    treasurer,
  );
  expect(created.createCampaign.success, created.createCampaign.message).toBe(true);
  const campaign = refOf(created.createCampaign.campaign);
  if (opts.stage !== "draft") {
    const submitted = await gqlOk(
      backend,
      `mutation($id: ID!) { submitCampaign(id: $id) { success message } }`,
      { id: campaign.id },
      treasurer,
    );
    expect(submitted.submitCampaign.success, submitted.submitCampaign.message).toBe(true);
  }
  if (opts.stage === "approved") {
    const pastor = await tokenOf(backend, world, "pastor");
    const approved = await gqlOk(
      backend,
      `mutation($id: ID!) { approveCampaign(id: $id) { success message } }`,
      { id: campaign.id },
      pastor,
    );
    expect(approved.approveCampaign.success, approved.approveCampaign.message).toBe(true);
  }
  rememberCampaign(world, campaign);
  return campaign;
}

/** The campaign as staff see it (status, progress), through GraphQL. */
export async function campaignAsStaff(backend: Backend, world: World, id: string) {
  const token = await tokenOf(backend, world, "admin");
  const data = await gqlOk(
    backend,
    `query($id: ID!) { campaign(id: $id) { ${CAMPAIGN_REF} progress { raised donorCount giftCount } } }`,
    { id },
    token,
  );
  return data.campaign as { status: string; progress: { raised: string; donorCount: number; giftCount: number } };
}

/** A gift by M-Pesa prompt (API, as the give panel does it), paid on the phone. */
export async function giftByPrompt(backend: Backend, campaign: CampaignRef, phone: string, amount: string) {
  const data = await gqlOk(
    backend,
    `mutation($p: String!, $a: String!, $c: ID!, $pu: ID, $cid: ID) {
       initiateContribution(phoneNumber: $p, amount: $a, categoryId: $c, purposeId: $pu, campaignId: $cid) {
         success message
       }
     }`,
    { p: phone, a: amount, c: campaign.categoryId, pu: campaign.purposeId, cid: campaign.id },
  );
  expect(data.initiateContribution.success, data.initiateContribution.message).toBe(true);
  await backend.respondToStk(phone, "pay", true);
}

/** Leaves the signed-in session (tokens are in localStorage, the flag in a cookie). */
export async function signOutOfBrowser(page: Page) {
  await page.context().clearCookies();
  if (page.url().startsWith("http")) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

export async function switchUserInBrowser(page: Page, backend: Backend, world: World, key: string) {
  await signOutOfBrowser(page);
  await signInThroughUi(page, backend, seededPerson(world, key).phone);
}

/** "KES 1,500.00", as the web app prints money. */
export function kes(amount: number | string): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
