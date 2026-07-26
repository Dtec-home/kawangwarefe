/**
 * Admin Receipt Book Settings E2E (Ticket 9 / FE-D.2).
 *
 * `/admin/receipt-settings` lets staff configure the auto-incrementing
 * manual receipt sequence: prefix, next number, and zero-padding.
 * `AdminProtectedRoute requiredAccess="staff"` gates the page — only
 * `isStaff` may access it (see components/auth/admin-protected-route.tsx).
 *
 * Mirrors the known-correct behavior encoded in
 * __tests__/app/admin/receipt-settings.test.tsx: seeded inputs from the
 * current sequence, a submit that calls SetReceiptSequence with the parsed
 * values, and null prefix/padding when those fields are cleared. Also adds
 * real e2e-only coverage: client-side validation errors (no mutation call)
 * and denial for a non-staff role.
 */

import { test, expect, Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";

type RoleName = "staff" | "category-admin" | "member";

function roleResponse(role: RoleName) {
  return {
    isAuthenticated: true,
    isStaff: role === "staff",
    isCategoryAdmin: role === "category-admin",
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: false,
    adminCategoryIds: [],
    adminCategories: [],
    adminGroupNames: [],
  };
}

interface Sequence {
  prefix: string;
  nextNumber: number;
  padding: number;
  nextReceiptNumber: string;
}

function formatNumber(seq: { prefix: string | null; nextNumber: number; padding: number | null }) {
  const padding = seq.padding ?? 4;
  const prefix = seq.prefix ?? "";
  return `${prefix}${String(seq.nextNumber).padStart(padding, "0")}`;
}

/**
 * Single stateful route handler per test, mirroring the pattern in
 * admin-groups-crud.spec.ts. Tracks the "current" sequence server-side so
 * that a save is reflected in the subsequent refetch of GetNextReceiptNumber,
 * the same way the real backend would behave.
 */
async function interceptGraphQL(
  page: Page,
  role: RoleName,
  initial: Sequence,
  setMutationHandlers: { calls: Array<Record<string, unknown>> }
) {
  let current = { ...initial };

  await page.route(/\/graphql\/?$/, async (route, request) => {
    let q = "";
    let variables: Record<string, unknown> = {};
    try {
      const body = request.postDataJSON();
      q = body?.query ?? "";
      variables = body?.variables ?? {};
    } catch {
      /* ignore */
    }

    const respond = (body: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (q.includes("currentUserRole")) {
      return respond({ data: { currentUserRole: roleResponse(role) } });
    }

    if (q.includes("SetReceiptSequence")) {
      setMutationHandlers.calls.push(variables);

      const nextNumber = (variables.nextNumber as number | null) ?? current.nextNumber;
      const prefix = (variables.prefix as string | null) ?? "";
      const padding = (variables.padding as number | null) ?? current.padding;

      current = {
        prefix,
        nextNumber,
        padding,
        nextReceiptNumber: formatNumber({ prefix, nextNumber, padding }),
      };

      return respond({
        data: {
          setReceiptSequence: {
            success: true,
            message: "Receipt sequence updated",
            sequence: current,
          },
        },
      });
    }

    if (q.includes("GetNextReceiptNumber")) {
      return respond({ data: { nextReceiptNumber: current } });
    }

    return respond({ data: null });
  });
}

test.describe("Admin Receipt Book Settings", () => {
  test("staff sees the current sequence and seeded inputs", async ({ page }) => {
    await injectSession(page);
    await interceptGraphQL(
      page,
      "staff",
      { prefix: "MB-", nextNumber: 1500, padding: 4, nextReceiptNumber: "MB-1500" },
      { calls: [] }
    );

    await page.goto("/admin/receipt-settings", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Receipt Book Settings" })).toBeVisible();
    await expect(page.getByText("Next auto-assigned number:")).toBeVisible();
    await expect(page.getByText("MB-1500")).toBeVisible();

    await expect(page.getByLabel("Prefix")).toHaveValue("MB-");
    await expect(page.getByLabel("Next number")).toHaveValue("1500");
    await expect(page.getByLabel("Padding (digits)")).toHaveValue("4");
  });

  test("staff updates the sequence and sees the new next receipt number", async ({ page }) => {
    await injectSession(page);
    const mutationCalls: Array<Record<string, unknown>> = [];
    await interceptGraphQL(
      page,
      "staff",
      { prefix: "MB-", nextNumber: 1500, padding: 4, nextReceiptNumber: "MB-1500" },
      { calls: mutationCalls }
    );

    await page.goto("/admin/receipt-settings", { waitUntil: "networkidle" });

    await page.getByLabel("Next number").fill("2000");
    await page.getByRole("button", { name: /Save Settings/i }).click();

    await expect(page.getByText("Saved")).toBeVisible();
    await expect(page.getByText(/Next receipt number: MB-2000/)).toBeVisible();

    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0]).toMatchObject({ nextNumber: 2000, prefix: "MB-", padding: 4 });

    // The card's "current sequence" banner reflects the refetch after save.
    await expect(page.getByText("MB-2000").first()).toBeVisible();
  });

  test("clearing prefix and padding sends null values to the mutation", async ({ page }) => {
    await injectSession(page);
    const mutationCalls: Array<Record<string, unknown>> = [];
    await interceptGraphQL(
      page,
      "staff",
      { prefix: "MB-", nextNumber: 1500, padding: 4, nextReceiptNumber: "MB-1500" },
      { calls: mutationCalls }
    );

    await page.goto("/admin/receipt-settings", { waitUntil: "networkidle" });

    await page.getByLabel("Prefix").fill("");
    await page.getByLabel("Padding (digits)").fill("");
    await page.getByRole("button", { name: /Save Settings/i }).click();

    await expect(page.getByText("Saved")).toBeVisible();
    expect(mutationCalls).toHaveLength(1);
    expect(mutationCalls[0]).toMatchObject({ prefix: null, padding: null });
  });

  test("client-side validation blocks an out-of-range padding without calling the mutation", async ({ page }) => {
    await injectSession(page);
    const mutationCalls: Array<Record<string, unknown>> = [];
    await interceptGraphQL(
      page,
      "staff",
      { prefix: "MB-", nextNumber: 1500, padding: 4, nextReceiptNumber: "MB-1500" },
      { calls: mutationCalls }
    );

    await page.goto("/admin/receipt-settings", { waitUntil: "networkidle" });

    await page.getByLabel("Padding (digits)").fill("15");
    await page.getByRole("button", { name: /Save Settings/i }).click();

    await expect(page.getByText("Padding must be between 1 and 10")).toBeVisible();
    expect(mutationCalls).toHaveLength(0);
  });

  test("non-staff (category admin) is redirected away from receipt settings", async ({ page }) => {
    await injectSession(page);
    await interceptGraphQL(
      page,
      "category-admin",
      { prefix: "MB-", nextNumber: 1500, padding: 4, nextReceiptNumber: "MB-1500" },
      { calls: [] }
    );

    await page.goto("/admin/receipt-settings", { waitUntil: "networkidle" });
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 12000 });

    expect(page.url()).not.toContain("/admin/receipt-settings");
    await expect(page.getByRole("heading", { name: "Receipt Book Settings" })).not.toBeVisible();
  });
});
