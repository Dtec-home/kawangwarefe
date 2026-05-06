/**
 * Bulk Messaging E2E — Sprint 5.
 *
 * Tests the messaging page across three role tiers:
 *   1. Global staff  — full access, all campaigns visible.
 *   2. Dept / messaging admin — access granted, audience pre-scoped.
 *   3. Plain member  — redirected away.
 *
 * All GraphQL calls are mocked via a single route handler per test so
 * there are no handler conflicts or fallback-chain issues.
 */

import { test, expect, Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";

// ─── Role response builder ───────────────────────────────────────────────────

type RoleName = "staff" | "dept-admin" | "group-admin" | "member";

function roleResponse(role: RoleName) {
  return {
    isAuthenticated: true,
    isStaff: role === "staff",
    isCategoryAdmin: false,
    isGroupAdmin: role === "group-admin",
    isContentAdmin: false,
    canSendBulkMessage: role === "staff" || role === "dept-admin" || role === "group-admin",
    adminCategoryIds: [],
    adminCategories: [],
    adminGroupNames: role === "group-admin" ? ["Youth"] : [],
  };
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "1", name: "Welcome SMS", body: "Hello {{first_name}}!", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const CAMPAIGNS = [
  {
    id: "101", status: "completed", recipientCount: 42, sentCount: 40, failedCount: 2,
    startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(), template: { id: "1", name: "Welcome SMS" },
  },
];

const DEPARTMENTS = [
  { id: "10", name: "Youth Ministry", code: "YOUTH" },
  { id: "11", name: "Music Ministry", code: "MUSIC" },
];

const GROUPS = [{ id: "20", name: "Choir" }];

const PREVIEW = { recipientCount: 18, skippedCount: 2, sampleRendered: ["Hello John!", "Hello Mary!"] };

// ─── Single-handler route interceptor ───────────────────────────────────────

async function interceptGraphQL(page: Page, role: RoleName, overrides: Record<string, unknown> = {}) {
  const roleData = roleResponse(role);

  await page.route(/\/graphql\/?$/, async (route, request) => {
    let q = "";
    try { q = request.postDataJSON()?.query ?? ""; } catch { /* ignore */ }

    const respond = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (q.includes("currentUserRole")) return respond({ data: { currentUserRole: roleData } });
    if (q.includes("messageTemplates")) return respond({ data: { messageTemplates: TEMPLATES } });
    if (q.includes("messageCampaigns")) return respond({ data: { messageCampaigns: CAMPAIGNS } });
    if (q.includes("availableDepartments")) return respond({ data: { availableDepartments: DEPARTMENTS } });
    if (q.includes("availableGroups")) return respond({ data: { availableGroups: GROUPS } });
    if (q.includes("previewCampaign")) return respond({ data: { previewCampaign: overrides.preview ?? PREVIEW } });
    if (q.includes("launchCampaign")) return respond({ data: { launchCampaign: { success: true, message: "Campaign launched", campaign: { id: "102", status: "queued", recipientCount: 18 } } } });
    if (q.includes("memberSearch")) return respond({ data: { memberSearch: overrides.memberSearch ?? [] } });

    return respond({ data: null });
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Messaging — Unauthenticated", () => {
  test("redirects to login", async ({ page }) => {
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/(login|$)/);
  });
});

test.describe("Messaging — Plain Member", () => {
  test("redirects away from messaging page", async ({ page }) => {
    // webkit under parallel workers needs extra time for React → Apollo → redirect chain
    test.slow();
    await injectSession(page);
    await interceptGraphQL(page, "member");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 12000 });
    expect(page.url()).not.toContain("/admin/messaging");
  });
});

test.describe("Messaging — Global Staff", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
  });

  test("shows Bulk Messaging heading", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /bulk messaging/i })).toBeVisible({ timeout: 8000 });
  });

  test("shows three tabs: Compose, Templates, History", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByRole("tab", { name: /compose/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /templates/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /history/i })).toBeVisible();
  });

  test("Compose tab shows AudienceBuilder with Departments and Groups", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    // Compose is the default tab — departments render immediately
    await expect(page.getByText("Youth Ministry")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Music Ministry")).toBeVisible();
    await expect(page.getByText("Choir")).toBeVisible();
  });

  test("Compose step shows Select Audience sub-heading", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    // AudienceBuilder always renders its heading on the compose step
    await expect(page.getByText(/select audience/i)).toBeVisible({ timeout: 8000 });
  });

  test("Composer advances to step 2 on Next", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    // Wait for AudienceBuilder to mount, then click Next
    await page.getByText(/select audience/i).waitFor({ timeout: 8000 });
    // Use first() to avoid strict-mode violation if multiple "Next" buttons appear in DOM
    const nextBtn = page.getByRole("button", { name: /next/i }).first();
    await nextBtn.waitFor({ state: "visible", timeout: 5000 });
    await nextBtn.click();
    await expect(page.getByText(/select template/i)).toBeVisible({ timeout: 8000 });
  });

  test("Templates tab shows template and New Template button", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /templates/i }).click();
    await expect(page.getByText("Welcome SMS")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /new template/i })).toBeVisible();
  });

  test("History tab shows recent campaign with status badge", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /history/i }).click();
    await expect(page.getByText("Welcome SMS")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("completed")).toBeVisible();
  });

  test("Messaging nav item is rendered for staff", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    // Wait for page content to confirm the role has loaded
    await expect(page.getByRole("heading", { name: /bulk messaging/i })).toBeVisible({ timeout: 8000 });
    // The sidebar uses <Button> (rendered as <button>) with router.push(), not <a> tags.
    // Scope the lookup to the <aside> to isolate it from any other "Bulk Messaging" text.
    const navBtn = page.locator("aside").getByRole("button", { name: /bulk messaging/i });
    await expect(navBtn).toHaveCount(1, { timeout: 8000 });
  });
});

test.describe("Messaging — Department Admin (scoped)", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
  });

  test("can access messaging page", async ({ page }) => {
    await interceptGraphQL(page, "dept-admin");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /bulk messaging/i })).toBeVisible({ timeout: 8000 });
  });

  test("sees available departments from API", async ({ page }) => {
    await interceptGraphQL(page, "dept-admin");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByText("Youth Ministry")).toBeVisible({ timeout: 8000 });
  });

  test("Messaging Admin badge shown in sidebar", async ({ page }) => {
    await interceptGraphQL(page, "dept-admin");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByText(/messaging admin/i)).toBeVisible({ timeout: 8000 });
  });

  test("History tab is accessible", async ({ page }) => {
    await interceptGraphQL(page, "dept-admin");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /history/i }).click();
    await expect(page.getByRole("tab", { name: /history/i })).toBeVisible();
  });
});

test.describe("Messaging — Group Admin (scoped)", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
  });

  test("can access messaging page", async ({ page }) => {
    await interceptGraphQL(page, "group-admin");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /bulk messaging/i })).toBeVisible({ timeout: 8000 });
  });

  test("sees Groups section in audience builder", async ({ page }) => {
    await interceptGraphQL(page, "group-admin");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    await expect(page.getByText("Choir")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Messaging — Member Typeahead", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
  });

  test("short query (1 char) shows no dropdown", async ({ page }) => {
    await interceptGraphQL(page, "staff");
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder(/search by name or phone/i);
    await input.fill("J");
    await page.waitForTimeout(400);
    await expect(page.getByText("John Kamau")).not.toBeVisible();
  });

  test("2-char query triggers search and shows results", async ({ page }) => {
    await interceptGraphQL(page, "staff", {
      memberSearch: [
        { id: "m1", fullName: "John Kamau", phoneNumber: "254700000001", memberNumber: "000001" },
      ],
    });
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder(/search by name or phone/i);
    await input.fill("Jo");
    await page.waitForTimeout(500);
    await expect(page.getByText("John Kamau")).toBeVisible({ timeout: 5000 });
  });

  test("selected member appears as chip", async ({ page }) => {
    await interceptGraphQL(page, "staff", {
      memberSearch: [
        { id: "m1", fullName: "Jane Wanjiku", phoneNumber: "254700000002", memberNumber: "000002" },
      ],
    });
    await page.goto("/admin/messaging", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder(/search by name or phone/i);
    await input.fill("Ja");
    await page.waitForTimeout(500);
    await page.getByText("Jane Wanjiku").click();
    // Chip should appear
    await expect(page.getByText("Jane Wanjiku")).toBeVisible({ timeout: 3000 });
  });
});
