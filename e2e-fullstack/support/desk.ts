/**
 * Lane E2E-D helpers (desk, books and USSD): campaign set-up shortcuts through
 * GraphQL, the browser's own access token, Radix select picking, and a USSD
 * gateway that posts to /ussd/callback/ the way the network operator does.
 */

import { APIRequestContext, Page, expect } from "@playwright/test";
import { BACKEND_URL, Backend, Seed } from "./backend";

export interface DeskCampaign {
  id: string;
  slug: string;
  title: string;
  code: string;
}

/** What the lane's scenarios remember between steps (kept on world.values). */
export const KEYS = {
  campaignId: "desk.campaignId",
  campaignSlug: "desk.campaignSlug",
  campaignTitle: "desk.campaignTitle",
  campaignCode: "desk.campaignCode",
  newPhone: "desk.newPhone",
  ussdPhone: "desk.ussdPhone",
  ussdSession: "desk.ussdSession",
  ussdText: "desk.ussdText",
  ussdReply: "desk.ussdReply",
} as const;

function check(result: { data?: Record<string, { success?: boolean; message?: string }>; errors?: unknown[] }, field: string) {
  if (result.errors) throw new Error(`${field}: ${JSON.stringify(result.errors)}`);
  const payload = result.data?.[field];
  if (!payload?.success) throw new Error(`${field} refused: ${payload?.message ?? JSON.stringify(result)}`);
  return payload as Record<string, unknown>;
}

/** One OTP login per phone per scenario (the world is fresh after each reset). */
export async function tokenOnce(backend: Backend, values: Record<string, string>, phone: string): Promise<string> {
  const key = `desk.token.${phone}`;
  if (!values[key]) values[key] = await backend.tokenFor(phone);
  return values[key];
}

/**
 * An active campaign in a department: the treasurer drafts and submits it,
 * the admin (not the creator) approves it.
 */
export async function createActiveCampaign(
  backend: Backend,
  seed: Seed,
  values: Record<string, string>,
  options: { title: string; code: string; department?: string; target?: string; allowChampions?: boolean },
): Promise<DeskCampaign> {
  const treasurer = await tokenOnce(backend, values, seed.people.treasurer.phone);
  const admin = await tokenOnce(backend, values, seed.people.admin.phone);
  const created = check(
    await backend.graphql(
      `mutation($input: CampaignInput!) { createCampaign(input: $input) { success message campaign { id slug title paybillCode } } }`,
      {
        input: {
          title: options.title,
          categoryId: String(seed.departments[options.department ?? "BLDG"].id),
          targetAmount: options.target ?? "500000",
          paybillCode: options.code,
          summary: `${options.title} for the church`,
          isPublic: true,
          allowPledges: true,
          allowChampions: options.allowChampions ?? true,
        },
      },
      treasurer,
    ),
    "createCampaign",
  );
  const campaign = created.campaign as { id: string; slug: string; title: string; paybillCode: string };
  check(await backend.graphql(`mutation($id: ID!) { submitCampaign(id: $id) { success message } }`, { id: campaign.id }, treasurer), "submitCampaign");
  check(await backend.graphql(`mutation($id: ID!) { approveCampaign(id: $id) { success message } }`, { id: campaign.id }, admin), "approveCampaign");
  return { id: campaign.id, slug: campaign.slug, title: campaign.title, code: campaign.paybillCode };
}

/** Staff invite a member as a champion with a code: active straight away. */
export async function inviteChampion(
  backend: Backend,
  seed: Seed,
  values: Record<string, string>,
  campaignId: string,
  phone: string,
  code: string,
) {
  const treasurer = await tokenOnce(backend, values, seed.people.treasurer.phone);
  const result = check(
    await backend.graphql(
      `mutation($c: ID!, $p: String!, $code: String!) { inviteChampion(campaignId: $c, phoneNumber: $p, code: $code) { success message champion { id code status } } }`,
      { c: campaignId, p: phone, code },
      treasurer,
    ),
    "inviteChampion",
  );
  expect((result.champion as { status: string }).status).toBe("ACTIVE");
}

/** The signed-in browser's access token (the app keeps it in localStorage). */
export async function browserToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => window.localStorage.getItem("access_token"));
  if (!token) throw new Error("the browser is not signed in");
  return token;
}

/** Mark the page tours as seen for the signed-in user, so no overlay covers the page. */
export async function dismissTours(backend: Backend, page: Page, keys: string[]) {
  const token = await browserToken(page);
  for (const key of keys) {
    await backend.graphql(
      `mutation($k: String!) { updateTutorialStatus(tutorialKey: $k, completed: true) { success } }`,
      { k: key },
      token,
    );
  }
}

/** Pick an option of a Radix select opened from the trigger with this id. */
export async function pickOption(page: Page, triggerId: string, option: string | RegExp) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: option }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
}

/** "KES 1,500.00", as the app formats money. */
export function kes(amount: number | string): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A phone number the seed never uses, different on every run. */
export function freshPhone(): string {
  return `25472${String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0")}`;
}

/** Today in Nairobi as YYYY-MM-DD (the expense date field). */
export function nairobiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
}

export interface UssdReply {
  text: string;
  responseType: "CON" | "END";
}

/**
 * The network operator's side of a USSD session (Infinity Kartal JSON): every
 * key press re-posts the caller's whole input so far.
 */
export async function ussdPost(
  request: APIRequestContext,
  sessionId: string,
  phone: string,
  text: string,
): Promise<UssdReply> {
  const response = await request.post(`${BACKEND_URL}/ussd/callback/`, {
    data: {
      sessionId,
      msisdn: phone,
      code: "*710*13414#",
      text,
      countryCode: 254,
      network: "Safaricom KE",
      level: 1,
      input: text ? text.split("*").pop() : "",
    },
  });
  expect(response.ok(), `USSD ${text || "(dial)"} answered ${response.status()}`).toBeTruthy();
  return response.json();
}
