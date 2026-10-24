/**
 * Lane E2E-D steps, part 3: "4. Campaigns & Pledges" on USSD. Every key press
 * is posted to /ussd/callback/ the way the network operator does, with the
 * caller's whole input so far; staff then check the result in the app.
 *
 * The USSD rate limit is 10 requests per phone per minute, so each scenario
 * keeps a caller under 10 requests.
 */

import { randomUUID } from "node:crypto";
import { Then, When, expect } from "../support/fixtures";
import type { World } from "../support/fixtures";
import { KEYS, kes, tokenOnce, ussdPost } from "../support/desk";

function screen(world: World) {
  return JSON.parse(world.values[KEYS.ussdReply]) as { text: string; responseType: "CON" | "END" };
}

async function press(request: import("@playwright/test").APIRequestContext, world: World, text: string) {
  const reply = await ussdPost(request, world.values[KEYS.ussdSession], world.values[KEYS.ussdPhone], text);
  world.values[KEYS.ussdText] = text;
  world.values[KEYS.ussdReply] = JSON.stringify(reply);
}

function startSession(world: World, role: string) {
  world.values[KEYS.ussdPhone] = world.seed!.people[role].phone;
  world.values[KEYS.ussdSession] = `e2e-${randomUUID()}`;
}

When(/^(?:the )?(member2|member) dials the church USSD code$/, async ({ request, world }, role: string) => {
  startSession(world, role);
  await press(request, world, "");
});

When(
  /^(?:the )?(member2|member) dials the church USSD code again and opens My pledges$/,
  async ({ request, world }, role: string) => {
    startSession(world, role);
    await press(request, world, "4");
    await press(request, world, "4*2");
  },
);

When("the USSD caller presses {string}", async ({ request, world }, key: string) => {
  const so_far = world.values[KEYS.ussdText];
  expect(screen(world).responseType, `the session already ended: ${screen(world).text}`).toBe("CON");
  await press(request, world, so_far ? `${so_far}*${key}` : key);
});

Then("the USSD screen offers {string}", async ({ world }, text: string) => {
  const reply = screen(world);
  expect(reply.responseType).toBe("CON");
  expect(reply.text).toContain(text);
  expect(reply.text.length).toBeLessThanOrEqual(182); // one USSD screen
});

Then("the USSD session ends with {string}", async ({ world }, text: string) => {
  const reply = screen(world);
  expect(reply.responseType, reply.text).toBe("END");
  expect(reply.text).toContain(text);
});

Then(
  "an M-Pesa prompt for {int} to account {string} waits on the USSD caller's phone",
  async ({ backend, world }, amount: number, account: string) => {
    const prompts = await backend.stkRequests(world.values[KEYS.ussdPhone]);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({ accountReference: account, state: "pending" });
    expect(Number(prompts[0].amount)).toBe(amount);
  },
);

When("the USSD caller pays the M-Pesa prompt", async ({ backend, world }) => {
  const result = await backend.respondToStk(world.values[KEYS.ussdPhone], "pay");
  expect(result.callbackStatus).toBe(200);
});

Then(
  "the desk campaign has raised {string} from {int} gift",
  async ({ backend, world }, raised: string, gifts: number) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.treasurer.phone);
    await expect
      .poll(async () => {
        const result = await backend.graphql(
          `query($id: ID!) { campaign(id: $id) { progress { raised giftCount } } }`,
          { id: world.values[KEYS.campaignId] },
          token,
        );
        const progress = result.data?.campaign?.progress;
        return progress && { raised: Number(progress.raised), giftCount: progress.giftCount };
      })
      .toEqual({ raised: Number(raised), giftCount: gifts });
  },
);

Then(
  "the desk campaign's champion {string} has raised {string} by the treasurer's books",
  async ({ backend, world }, code: string, raised: string) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.treasurer.phone);
    const result = await backend.graphql(
      `query($id: ID!) { champions(campaignId: $id) { code raised donorCount } }`,
      { id: world.values[KEYS.campaignId] },
      token,
    );
    const champions = (result.data?.champions ?? []) as { code: string; raised: string; donorCount: number }[];
    expect(champions.map((c) => ({ ...c, raised: Number(c.raised) }))).toEqual([
      { code, raised: Number(raised), donorCount: 1 },
    ]);
  },
);

When("the treasurer opens the pledge register", async ({ page }) => {
  await page.goto("/admin/pledges");
  await expect(page.getByRole("heading", { name: "Pledges" })).toBeVisible();
});

Then(
  "the pledge register lists {string} pledging {string} to the desk campaign",
  async ({ page, world }, name: string, amount: string) => {
    const row = page.locator("tbody tr").filter({ hasText: name });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(world.values[KEYS.campaignTitle]);
    await expect(row).toContainText(amount);
    await expect(page.getByTestId("pledge-total-outstanding")).toContainText(amount);
  },
);

Then(
  "the USSD screen shows a balance of {int} for the desk campaign",
  async ({ world }, balance: number) => {
    const reply = screen(world);
    expect(reply.responseType).toBe("CON");
    // Titles are shortened to fit the screen; the code and balance always show.
    expect(reply.text).toMatch(/1\. New Church/);
    expect(reply.text).toContain(kes(balance).replace(/\.00$/, ""));
  },
);
