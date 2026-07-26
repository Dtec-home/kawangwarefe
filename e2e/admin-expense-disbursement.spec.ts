/**
 * KCB disbursement E2E — admin/expenses page.
 *
 * Tests form/dialog mechanics for the new payout-channel capture and
 * "Disburse via KCB" confirmation flow. All GraphQL calls are mocked via a
 * single route handler (mirrors admin-messaging.spec.ts's pattern) — this
 * tests UI behaviour, not real KCB/backend calls (which is exactly the
 * restraint the existing contribution-flow.spec.ts already establishes for
 * money-flow specs in this repo).
 */

import { test, expect, Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";

function roleResponse() {
  return {
    isAuthenticated: true,
    isStaff: true,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: true,
    adminCategoryIds: [],
    adminCategories: [],
    adminGroupNames: [],
  };
}

const CATEGORIES = [{ id: "1", name: "Building Fund", code: "BUILD" }];

function makeExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: "500",
    amount: "4321.00",
    expenseDate: "2026-07-17",
    payee: "Mocked Vendor",
    description: null,
    paymentMethod: "mpesa",
    referenceNumber: null,
    status: "approved",
    category: { id: "1", name: "Building Fund" },
    purpose: null,
    recordedBy: "treasurer1",
    approvedBy: "admin1",
    paidBy: null,
    voidReason: "",
    requestedByMe: false,
    canApprove: false,
    canMarkPaid: true,
    canDisburse: true,
    attachmentUrl: null,
    createdAt: new Date().toISOString(),
    payoutChannel: "mobile_money",
    beneficiaryAccountNumber: "",
    beneficiaryPhoneNumber: "254712345678",
    beneficiaryBankCode: "",
    kcbDisbursement: null,
    ...overrides,
  };
}

async function interceptGraphQL(
  page: Page,
  expenses: ReturnType<typeof makeExpense>[],
  overrides: Record<string, unknown> = {}
) {
  await page.route(/\/graphql\/?$/, async (route, request) => {
    let q = "";
    try {
      q = request.postDataJSON()?.query ?? "";
    } catch {
      /* ignore */
    }

    const respond = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (q.includes("currentUserRole")) return respond({ data: { currentUserRole: roleResponse() } });
    if (q.includes("GetExpenses") || q.includes("expenses(")) return respond({ data: { expenses } });
    if (q.includes("contributionCategories")) return respond({ data: { contributionCategories: CATEGORIES } });
    if (q.includes("departmentPurposes")) return respond({ data: { departmentPurposes: [] } });
    if (q.includes("InitiateKcbDisbursement")) {
      return respond({
        data: {
          initiateKcbDisbursement: overrides.initiateResult ?? {
            success: true,
            message: "Disbursement initiated",
            expense: makeExpense({ status: "disbursing", canDisburse: false, canMarkPaid: false }),
          },
        },
      });
    }

    return respond({ data: null });
  });
}

test.describe("Admin Expenses — payout channel capture", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
    await interceptGraphQL(page, [makeExpense()]);
    await page.goto("/admin/expenses", { waitUntil: "networkidle" });
  });

  test("Request Expense dialog defaults payout channel to Manual with no beneficiary fields", async ({ page }) => {
    await page.getByRole("button", { name: /request expense/i }).click();
    await expect(page.getByText(/new expense request/i)).toBeVisible();
    await expect(page.locator("#exp-payout-channel")).toContainText(/manual/i);
    await expect(page.locator("#exp-beneficiary-phone")).toHaveCount(0);
    await expect(page.locator("#exp-beneficiary-account")).toHaveCount(0);
  });

  test("selecting Mobile money reveals the beneficiary phone field", async ({ page }) => {
    await page.getByRole("button", { name: /request expense/i }).click();
    await page.locator("#exp-payout-channel").click();
    await page.getByRole("option", { name: /mobile money/i }).click();

    await expect(page.locator("#exp-beneficiary-phone")).toBeVisible();
    await expect(page.locator("#exp-beneficiary-account")).toHaveCount(0);
  });

  test("selecting Bank transfer reveals account number and bank code fields", async ({ page }) => {
    await page.getByRole("button", { name: /request expense/i }).click();
    await page.locator("#exp-payout-channel").click();
    await page.getByRole("option", { name: /bank transfer/i }).click();

    await expect(page.locator("#exp-beneficiary-account")).toBeVisible();
    await expect(page.locator("#exp-beneficiary-bank-code")).toBeVisible();
    await expect(page.locator("#exp-beneficiary-phone")).toHaveCount(0);
  });

  test("switching back to Manual hides the beneficiary fields again", async ({ page }) => {
    await page.getByRole("button", { name: /request expense/i }).click();
    await page.locator("#exp-payout-channel").click();
    await page.getByRole("option", { name: /mobile money/i }).click();
    await expect(page.locator("#exp-beneficiary-phone")).toBeVisible();

    await page.locator("#exp-payout-channel").click();
    await page.getByRole("option", { name: /^manual/i }).click();
    await expect(page.locator("#exp-beneficiary-phone")).toHaveCount(0);
  });
});

test.describe("Admin Expenses — Disburse via KCB", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
  });

  test("an eligible expense row shows the Disburse via KCB action", async ({ page }) => {
    await interceptGraphQL(page, [makeExpense()]);
    await page.goto("/admin/expenses", { waitUntil: "networkidle" });

    await expect(page.getByRole("button", { name: /disburse via kcb/i }).first()).toBeVisible();
  });

  test("an expense without canDisburse does not show the action", async ({ page }) => {
    await interceptGraphQL(page, [makeExpense({ canDisburse: false })]);
    await page.goto("/admin/expenses", { waitUntil: "networkidle" });

    // Mobile-card and desktop-table views are both always in the DOM
    // (CSS-hidden by breakpoint, not conditionally rendered) — scope to the
    // table, which is what's actually visible at this viewport.
    await expect(page.locator("table").getByText("Mocked Vendor")).toBeVisible();
    await expect(page.getByRole("button", { name: /disburse via kcb/i })).toHaveCount(0);
  });

  test("clicking Disburse via KCB opens a confirmation dialog summarizing the payout, and Cancel closes it without submitting", async ({ page }) => {
    let initiateCalls = 0;
    await page.route(/\/graphql\/?$/, async (route, request) => {
      let q = "";
      try {
        q = request.postDataJSON()?.query ?? "";
      } catch {
        /* ignore */
      }
      if (q.includes("InitiateKcbDisbursement")) initiateCalls += 1;
      route.continue();
    });
    await interceptGraphQL(page, [makeExpense()]);
    await page.goto("/admin/expenses", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /disburse via kcb/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/disburse via kcb/i)).toBeVisible();
    await expect(dialog.getByText("KES 4,321")).toBeVisible();
    await expect(dialog.getByText("254712345678")).toBeVisible();

    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(initiateCalls).toBe(0);
  });

  test("confirming disbursement submits the mutation and closes the dialog", async ({ page }) => {
    await interceptGraphQL(page, [makeExpense()]);
    await page.goto("/admin/expenses", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /disburse via kcb/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: /confirm & disburse/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 10000 });
  });
});
