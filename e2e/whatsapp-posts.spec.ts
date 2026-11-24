/**
 * WhatsApp totals posts and shout-outs (WA-3, WA-2 web), mocked GraphQL.
 *
 * US-20 givers are tagged unless the campaign switches it off.
 * US-21 a member switches off being tagged, in their profile.
 * US-22 an admin sets when the totals post goes, church-wide and per campaign.
 * US-23 an admin picks the blocks, their order and the texts, with a live preview.
 *
 * Desktop and 390 px. Plan: DEPARTMENT_REPORTS/03_ADDITIONS_FUNDS_WHATSAPP.md.
 */

import { test, expect } from "@playwright/test";
import { fakeWhatsAppPosts, noSidewaysScroll, unnamedControls } from "./helpers/whatsapp-posts";

// The dev server compiles each route on first hit; give cold starts room.
test.describe.configure({ timeout: 90_000 });

const CAMPAIGN_TAB = "/admin/campaigns/9?tab=whatsapp-posts";

test.describe("WhatsApp posts — desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("the admin sets the church schedule, blocks and group with a live preview (US-22, US-23)", async ({ page }) => {
    const state = await fakeWhatsAppPosts(page, { persona: "admin" });
    await page.goto("/admin/whatsapp-posts");
    await expect(page.getByRole("heading", { name: "WhatsApp posts", level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("schedule-summary")).toHaveText("Hourly 08:00–20:00 when something changed, plus 23:50");
    await expect(page.getByTestId("totals-preview")).toContainText("Today: KES 5,000 from 3 givers");
    await expect(page.getByTestId("totals-preview").locator("strong")).toHaveText("📢 Church Building");

    // The admins-only link is in the sidebar.
    await expect(page.locator("aside").getByRole("button", { name: "WhatsApp posts" })).toBeVisible();

    await page.getByLabel("At fixed times").check();
    await page.getByRole("button", { name: "Add a time" }).click();
    await page.getByRole("button", { name: "Add a time" }).click();
    await expect(page.getByLabel("Fixed time 1")).toHaveValue("12:00");
    await expect(page.getByLabel("Fixed time 2")).toHaveValue("18:00");
    await expect(page.getByTestId("schedule-summary")).toHaveText("At 12:00 and 18:00 when something changed, plus 23:50");

    await page.getByRole("switch", { name: "Show Thank-you line" }).click();
    await page.getByRole("button", { name: "Move Thank-you line up" }).click();
    await page.getByLabel("Intro text", { exact: true }).fill("Karibu wote!");
    await expect(page.getByTestId("intro-text-count")).toHaveText("12/1000");
    await expect(page.getByTestId("totals-preview")).toContainText("Karibu wote!");
    await expect(page.getByTestId("totals-preview")).toContainText("🙏 Thank you @Kamau!");

    await page.getByLabel("Church WhatsApp group").selectOption({ label: "Kawangware Church" });
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("WhatsApp post settings saved.")).toBeVisible();
    expect(state.church.scheduleKind).toBe("fixed_times");
    expect(state.church.fixedTimes).toEqual(["12:00", "18:00"]);
    expect(state.church.introText).toBe("Karibu wote!");
    expect(state.church.churchWhatsappGroupId).toBe("120363001@g.us");
    const keys = state.church.layout.map((b) => b.block);
    expect(keys.indexOf("thank_you")).toBeLessThan(keys.indexOf("given_earlier_days"));

    await page.reload();
    await expect(page.getByTestId("schedule-summary")).toHaveText("At 12:00 and 18:00 when something changed, plus 23:50", { timeout: 30_000 });
    await expect(page.getByLabel("Church WhatsApp group")).toHaveValue("120363001@g.us");
  });

  test("a refused interval is caught before sending", async ({ page }) => {
    const state = await fakeWhatsAppPosts(page, { persona: "admin" });
    await page.goto("/admin/whatsapp-posts");
    await page.getByLabel("Window end").fill("07:00", { timeout: 30_000 });
    await expect(page.getByText("The window must start before it ends.")).toBeVisible();
    await expect(page.getByText("Fix the settings to see the preview.")).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Fix the highlighted settings first.")).toBeVisible();
    expect(state.calls.some((c) => c.op === "UpdateWhatsappPostSettings")).toBe(false);
  });

  test("the gateway being down is explained, with a retry", async ({ page }) => {
    await fakeWhatsAppPosts(page, { persona: "admin", groupsFailures: 1 });
    await page.goto("/admin/whatsapp-posts");
    await expect(page.getByText(/The WhatsApp gateway did not answer/)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByLabel("Church WhatsApp group").locator("option", { hasText: "Building Committee" })).toHaveCount(1);
    await expect(page.getByText(/The WhatsApp gateway did not answer/)).toHaveCount(0);
  });

  test("a campaign overrides the interval, sends a test and stops tagging (US-20, US-22)", async ({ page }) => {
    const state = await fakeWhatsAppPosts(page, { persona: "admin" });
    await page.goto(CAMPAIGN_TAB);
    const follow = page.getByRole("switch", { name: "Use the church settings" });
    await expect(follow).toHaveAttribute("aria-checked", "true", { timeout: 30_000 });
    await expect(page.getByTestId("church-schedule-summary")).toHaveText("Hourly 08:00–20:00 when something changed, plus 23:50");
    await expect(page.getByTestId("totals-preview")).toContainText("Today: KES 5,000");

    await follow.click();
    await expect(page.getByText("Church: Hourly")).toBeVisible();
    await page.getByLabel("Post every").selectOption({ label: "2 hours" });
    await expect(page.getByText("Changed for this campaign")).toBeVisible();
    await expect(page.getByTestId("schedule-summary")).toHaveText("Every 2 hours 08:00–20:00 when something changed, plus 23:50");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("WhatsApp post settings saved.")).toBeVisible();
    expect(state.override.useChurchDefault).toBe(false);
    expect(state.override.intervalMinutes).toBe(120);
    expect(state.override.windowStart).toBeNull();
    expect(state.override.layout).toBeNull();

    // Test post: the first goes, a second within 10 minutes is refused with the reason.
    await page.getByRole("button", { name: "Send a test to the group now" }).click();
    await expect(page.getByText("Test post sent to the WhatsApp group.")).toBeVisible();
    await page.getByRole("button", { name: "Send a test to the group now" }).click();
    await expect(page.getByTestId("send-test-refused")).toContainText("Please wait 10 minutes");
    await expect(page.getByTestId("send-test-refused")).toContainText("One test can go to the group every 10 minutes for each campaign.");

    // Tagging (US-20, E2): on by default; the admin switches it off for this campaign.
    const tag = page.getByRole("switch", { name: "Tag givers in group posts" });
    await expect(tag).toHaveAttribute("aria-checked", "true");
    await tag.click();
    await expect(page.getByText("Givers will not be tagged in this campaign’s posts.")).toBeVisible();
    await expect(tag).toHaveAttribute("aria-checked", "false");
    expect(state.mentions).toBe(false);
    const update = state.calls.find((c) => c.op === "UpdateCampaign")!;
    expect((update.variables.input as Record<string, unknown>).countingMode).toBeNull();
  });

  test("a member switches off being tagged in their profile (US-21)", async ({ page }) => {
    const state = await fakeWhatsAppPosts(page, { persona: "member" });
    await page.goto("/profile/notifications");
    const toggle = page.getByRole("switch", { name: "Tag me in WhatsApp group thank-yous" });
    await expect(toggle).toHaveAttribute("aria-checked", "true", { timeout: 30_000 });
    await expect(page.getByText(/@your name/)).toBeVisible();
    await toggle.click();
    await expect(page.getByText("You will no longer be tagged in WhatsApp posts.")).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(state.tagging).toBe(false);
  });

  test("a treasurer gets no link and no editor", async ({ page }) => {
    await fakeWhatsAppPosts(page, { persona: "treasurer" });
    await page.goto("/admin/whatsapp-posts");
    await expect(page.getByText("Only admins change the WhatsApp posts")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("aside").getByRole("button", { name: "WhatsApp posts" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  });
});

test.describe("WhatsApp posts — on a phone (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the church screen fits and every control is named", async ({ page }) => {
    const state = await fakeWhatsAppPosts(page, { persona: "admin" });
    await page.goto("/admin/whatsapp-posts");
    await expect(page.getByTestId("schedule-summary")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("totals-preview")).toContainText("Today: KES 5,000");
    expect(await noSidewaysScroll(page)).toBe(true);
    expect(await unnamedControls(page)).toEqual([]);

    await page.getByRole("button", { name: "Saturday" }).click();
    await page.getByRole("button", { name: "Sunday" }).click();
    await expect(page.getByTestId("schedule-summary")).toHaveText("Hourly 08:00–20:00 when something changed, plus 23:50, Monday to Friday");
    await page.getByRole("button", { name: "Move How to give up" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("WhatsApp post settings saved.")).toBeVisible();
    expect(state.church.daysOfWeek).toEqual([0, 1, 2, 3, 4]);
    expect(state.church.layout.at(-1)?.block).toBe("closing");
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("the campaign tab fits on a phone", async ({ page }) => {
    await fakeWhatsAppPosts(page, { persona: "admin" });
    await page.goto(CAMPAIGN_TAB);
    await page.getByRole("switch", { name: "Use the church settings" }).click({ timeout: 30_000 });
    await expect(page.getByLabel("Post every")).toBeVisible();
    await expect(page.getByTestId("totals-preview")).toContainText("Today: KES 5,000");
    expect(await noSidewaysScroll(page)).toBe(true);
    expect(await unnamedControls(page)).toEqual([]);
  });
});
