/**
 * Sprint additions (DEPARTMENT_REPORTS/03_ADDITIONS_FUNDS_WHATSAPP.md, US-16..US-24):
 * API checks and set-up shortcuts for fund transfers, moving a gift, WhatsApp
 * shout-outs and announcements to the church group. Locators come from the
 * screens (components/fund-transfers/*, components/whatsapp-posts/*,
 * app/(dashboard)/admin/announcements/page.tsx).
 */

import { Page, expect } from "@playwright/test";
import { Backend, GroupPost } from "./backend";
import type { World } from "./fixtures";
import { departmentId, tokenOf } from "./campaigns";

export const KEYS = {
  paymentGroup: "additions.contributionGroupId",
} as const;

async function data(backend: Backend, token: string, query: string, variables: Record<string, unknown> = {}) {
  const result = await backend.graphql(query, variables, token);
  expect(result.errors, JSON.stringify(result.errors)).toBeFalsy();
  return result.data;
}

/** What a department holds today, as the transfer dialog reads it (fundAvailableBalance). */
export async function availableBalance(backend: Backend, world: World, department: string): Promise<number> {
  const token = await tokenOf(backend, world, "treasurer");
  const answer = await data(backend, token, `query($d: ID!) { fundAvailableBalance(departmentId: $d) }`, {
    d: departmentId(world, department),
  });
  return Number(answer.fundAvailableBalance);
}

/** A payment's completed lines (paymentLines), as the Move gift dialog loads them. */
export async function paymentLines(backend: Backend, world: World, contributionGroupId: string) {
  const token = await tokenOf(backend, world, "treasurer");
  const answer = await data(
    backend,
    token,
    `query($g: ID!) { paymentLines(contributionGroupId: $g) { department purpose amount } }`,
    { g: contributionGroupId },
  );
  return answer.paymentLines as { department: string; purpose: string | null; amount: string }[];
}

/** The church WhatsApp group for announcements, set by the admin through the API. */
export async function setChurchGroup(backend: Backend, world: World, groupId: string) {
  const token = await tokenOf(backend, world, "admin");
  const answer = await data(
    backend,
    token,
    `mutation($input: WhatsAppPostSettingsInput!) { updateWhatsappPostSettings(input: $input) { success message } }`,
    { input: { churchWhatsappGroupId: groupId } },
  );
  expect(answer.updateWhatsappPostSettings.success, answer.updateWhatsappPostSettings.message).toBe(true);
}

/** Posts to `groupId` whose gateway key starts with `keyPrefix`, oldest first. */
export async function postsTo(backend: Backend, groupId: string, keyPrefix = ""): Promise<GroupPost[]> {
  return (await backend.groupPosts()).filter(
    (post) => post.group_id === groupId && post.idempotency_key.startsWith(keyPrefix),
  );
}

/** Waits for the `count`-th post to `groupId` with that key prefix and returns it. */
export async function nthPost(backend: Backend, groupId: string, keyPrefix: string, count: number): Promise<GroupPost> {
  await expect
    .poll(async () => (await postsTo(backend, groupId, keyPrefix)).length, {
      message: `no post #${count} with key ${keyPrefix}… to ${groupId}`,
    })
    .toBeGreaterThanOrEqual(count);
  return (await postsTo(backend, groupId, keyPrefix))[count - 1];
}

// ── Locators ─────────────────────────────────────────────────────────────
export const transferRow = (page: Page, reason: string) =>
  page.getByTestId("fund-transfer-row").filter({ hasText: reason });

/** The one visible "Move gift…" button (the list renders a phone and a desktop layout). */
export const moveGiftButton = (page: Page) => page.getByRole("button", { name: "Move gift…" }).locator("visible=true");
