/**
 * Admin receipts E2E (T1.8 / T2.6).
 *
 * Journey as a treasurer: receipt register → receipt detail → print view →
 * void with a reason. A pastor (staff without `canVoidReceipts`) sees no void
 * action. GraphQL is intercepted with a small stateful fake of the receipts
 * API, so no live backend is needed — only the Next dev server that
 * playwright.config.ts starts.
 */

import { test, expect, Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";

type Persona = "treasurer" | "pastor";

function roleResponse(persona: Persona) {
  return {
    isAuthenticated: true,
    isStaff: true,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: true,
    isRecorder: false,
    canVoidReceipts: persona === "treasurer",
    isAdmin: false,
    isTreasurer: persona === "treasurer",
    adminCategoryIds: [],
    adminCategories: [],
    adminGroupNames: [],
  };
}

function nairobiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function makeReceipt(today: string) {
  const compact = today.replaceAll("-", "");
  return {
    __typename: "ReceiptType",
    id: "41",
    number: `${compact}-0001`,
    receiptDate: today,
    channel: "mpesa_c2b",
    status: "issued",
    totalAmount: "2500.00",
    giverName: null,
    memberName: "Mary Wanjiru",
    issuedByName: null,
    legacyBookNumber: null,
    mpesaCode: "TIH12ABC34",
    voidedAt: null as string | null,
    voidReason: "",
    createdAt: new Date().toISOString(),
    lines: [
      { __typename: "ReceiptLineType", id: "1", categoryName: "Tithe", purposeName: null, amount: "2000.00" },
      { __typename: "ReceiptLineType", id: "2", categoryName: "Combined Offering", purposeName: "Camp meeting", amount: "500.00" },
    ],
  };
}

async function interceptGraphQL(page: Page, persona: Persona) {
  const receipt = makeReceipt(nairobiToday());
  const voidCalls: Array<Record<string, unknown>> = [];

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

    if (q.includes("currentUserRole")) return respond({ data: { currentUserRole: roleResponse(persona) } });
    if (q.includes("GetPendingVoidRequestCount")) return respond({ data: { voidRequests: [] } });
    if (q.includes("GetVoidRequests")) return respond({ data: { voidRequests: [] } });
    if (q.includes("GetReceipts")) {
      return respond({ data: { receipts: { __typename: "ReceiptPage", totalCount: 1, items: [receipt] } } });
    }
    if (q.includes("GetReceipt")) {
      const found = variables.number === receipt.number ? receipt : null;
      return respond({ data: { receipt: found, churchProfile: { __typename: "ChurchProfile", displayName: "SDA Church Kawangware" } } });
    }
    if (q.includes("VoidReceipt")) {
      voidCalls.push(variables);
      receipt.status = "void";
      receipt.voidReason = String(variables.reason ?? "");
      receipt.voidedAt = new Date().toISOString();
      return respond({
        data: {
          voidReceipt: {
            __typename: "ReceiptVoidResponse",
            success: true,
            message: `Receipt ${receipt.number} voided`,
            receiptNumber: receipt.number,
            status: "void",
          },
        },
      });
    }
    return respond({ data: null });
  });

  return { receipt, voidCalls };
}

test.describe("Admin receipts", () => {
  test("treasurer: register → detail → print view → void", async ({ page }) => {
    await injectSession(page);
    const { receipt, voidCalls } = await interceptGraphQL(page, "treasurer");

    await page.goto("/admin/receipts", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Receipts" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Void requests/ })).toBeVisible();

    // Register → detail
    await page.getByText(receipt.number).filter({ visible: true }).first().click();
    // Generous timeout: the dev server compiles the detail route on first visit
    await expect(page).toHaveURL(new RegExp(`/receipts/${receipt.number}$`), { timeout: 60_000 });
    const card = page.getByRole("article", { name: `Receipt ${receipt.number}` });
    await expect(card).toBeVisible();
    await expect(card.getByText("SDA Church Kawangware")).toBeVisible();
    await expect(card.getByText("TIH12ABC34")).toBeVisible();
    await expect(card.getByText("Camp meeting")).toBeVisible();

    // Print view: app chrome hidden, receipt kept, print button hidden
    await page.emulateMedia({ media: "print" });
    await expect(card).toBeVisible();
    await expect(page.getByRole("button", { name: /Print/ })).toBeHidden();
    await expect(page.getByText("Church Admin").first()).toBeHidden();
    await page.emulateMedia({ media: "screen" });

    // Void: reason too short is refused, then a proper reason voids it
    await page.getByRole("button", { name: /^Void$/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Reason").fill("typo");
    await dialog.getByRole("button", { name: "Void receipt" }).click();
    await expect(dialog.getByText(/at least 10 characters/)).toBeVisible();
    expect(voidCalls).toHaveLength(0);

    await dialog.getByLabel("Reason").fill("Amount entered against the wrong member");
    await dialog.getByRole("button", { name: "Void receipt" }).click();
    await expect(dialog).toBeHidden();
    expect(voidCalls).toEqual([{ receiptId: "41", reason: "Amount entered against the wrong member" }]);
    await expect(card.getByText("This receipt is VOID")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Void$/ })).toBeHidden();
  });

  test("pastor: no void action in the register or on the receipt", async ({ page }) => {
    await injectSession(page);
    const { receipt } = await interceptGraphQL(page, "pastor");

    await page.goto("/admin/receipts", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Receipts" })).toBeVisible();
    await expect(page.getByText(receipt.number).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByLabel(/Void receipt/)).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Void requests/ })).toHaveCount(0);

    await page.goto(`/receipts/${receipt.number}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("article", { name: `Receipt ${receipt.number}` })).toBeVisible();
    await expect(page.getByRole("button", { name: /Print/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Void$/ })).toHaveCount(0);
  });

  test("unknown receipt shows not found", async ({ page }) => {
    await injectSession(page);
    await interceptGraphQL(page, "pastor");
    await page.goto("/receipts/19990101-0001", { waitUntil: "networkidle" });
    await expect(page.getByText("Receipt not found or not accessible")).toBeVisible();
  });
});
