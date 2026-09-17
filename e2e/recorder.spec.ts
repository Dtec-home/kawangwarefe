/**
 * Recorder E2E (T2.7).
 *
 * Journey: a recorder signs in and lands on /record → records a multi-line
 * cash gift and sees receipt YYYYMMDD-NNNN → /admin/reports sends them back
 * to /record → they request a void → a treasurer approves it in
 * /admin/receipts?tab=void-requests → the recorder's list shows VOID.
 *
 * GraphQL is intercepted with a small stateful fake (like
 * admin-receipts.spec.ts), so only the Next dev server is needed. The persona
 * answering `currentUserRole` is switched mid-test to play the treasurer.
 */

import { test, expect, Page } from "@playwright/test";

/** A JWT-shaped token the client can decode (the signature is fake). */
function fakeJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ user_id: 5, exp: now + 3600, iat: now })}.ZmFrZQ`;
}

type Persona = "recorder" | "treasurer";

function roleResponse(persona: Persona) {
  const treasurer = persona === "treasurer";
  return {
    __typename: "UserRoleInfo",
    isAuthenticated: true,
    isStaff: treasurer,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: treasurer,
    isRecorder: !treasurer,
    canVoidReceipts: treasurer,
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

const CATEGORIES = [
  { id: "1", name: "Tithe", code: "TITHE" },
  { id: "2", name: "Combined Offering", code: "OFFERING" },
].map((c) => ({
  __typename: "ContributionCategoryType",
  ...c,
  description: "",
  isActive: true,
  routingMode: "TOP_LEVEL",
  fallbackIfNoGroup: null,
  audience: "all",
  hasAutoSplit: false,
  tracksMemberIdentifier: false,
  identifierLabel: "",
  identifierFormat: "",
  allowedGroups: [],
}));

async function interceptGraphQL(page: Page) {
  const today = nairobiToday();
  const state = {
    persona: "recorder" as Persona,
    receipts: [] as Array<Record<string, unknown>>,
    voidRequests: [] as Array<Record<string, unknown>>,
    createCalls: [] as Array<Record<string, unknown>>,
    voidRequestCalls: [] as Array<Record<string, unknown>>,
  };

  await page.route(/\/graphql\/?$/, async (route, request) => {
    // The post-login role check is a plain cross-origin fetch: answer its
    // CORS preflight too.
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    let q = "";
    let op = "";
    let variables: Record<string, unknown> = {};
    try {
      const body = request.postDataJSON();
      q = body?.query ?? "";
      op = body?.operationName ?? "";
      variables = body?.variables ?? {};
    } catch {
      /* ignore */
    }
    const respond = (data: unknown) =>
      route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ data }) });
    const receiptNumber = String(variables.receiptNumber ?? "");
    const findReceipt = (number: string) => state.receipts.find((r) => r.number === number) ?? null;

    if (q.includes("currentUserRole")) return respond({ currentUserRole: roleResponse(state.persona) });

    switch (op) {
      case "RequestOtp":
        return respond({
          requestOtp: { __typename: "OtpResponse", success: true, message: "Code sent", expiresInMinutes: 5, otpCode: null },
        });
      case "VerifyOtp":
        return respond({
          verifyOtp: {
            __typename: "AuthResponse",
            success: true,
            message: "Login successful",
            accessToken: fakeJwt(),
            refreshToken: fakeJwt(),
            userId: 5,
            memberId: 5,
            phoneNumber: "254711000111",
            email: null,
            fullName: "Rita Recorder",
            isNewMember: false,
            needsPhoneLinking: false,
            linkingToken: null,
            needsRegistration: false,
            registrationToken: null,
          },
        });
      case "GetActiveEntryDateUnlocks":
        return respond({ activeEntryDateUnlocks: [] });
      case "GetContributionCategories":
        return respond({ contributionCategories: CATEGORIES });
      case "GetPaybillInstructionMessage":
        return respond({ paybillInstructionMessage: null });
      case "LookupMemberByPhone":
        // A pure recorder only gets the giver's name.
        return respond({
          lookupMemberByPhone: {
            __typename: "MemberLookupResponse",
            success: true,
            found: true,
            message: "Member found: Mary Wanjiru",
            isGuest: false,
            phoneNumber: null,
            member: null,
            giver: { __typename: "MemberLookupGiverType", id: "7", displayName: "Mary Wanjiru" },
          },
        });
      case "CreateManualMultiContribution": {
        state.createCalls.push(variables);
        const lines = (variables.contributions as Array<{ categoryId: string; amount: string }>) ?? [];
        const total = lines.reduce((sum, l) => sum + Number(l.amount), 0);
        const number = `${today.replaceAll("-", "")}-${String(state.receipts.length + 7).padStart(4, "0")}`;
        state.receipts.push({
          __typename: "ReceiptType",
          id: String(100 + state.receipts.length),
          number,
          receiptDate: today,
          channel: String(variables.entryType),
          status: "issued",
          totalAmount: total.toFixed(2),
          giverName: null,
          memberName: "Mary Wanjiru",
          issuedByName: "Rita Recorder",
          legacyBookNumber: null,
          mpesaCode: null,
          voidedAt: null,
          voidReason: "",
          createdAt: new Date().toISOString(),
          lines: lines.map((l, i) => ({
            __typename: "ReceiptLineType",
            id: String(i + 1),
            categoryName: CATEGORIES.find((c) => c.id === l.categoryId)?.name ?? "?",
            purposeName: null,
            amount: Number(l.amount).toFixed(2),
          })),
        });
        return respond({
          createManualMultiContribution: {
            __typename: "ManualMultiContributionResponse",
            success: true,
            message: "Recorded",
            contributionGroupId: "g1",
            totalAmount: total.toFixed(2),
            receiptNumber: number,
            isGuest: false,
            smsSent: true,
          },
        });
      }
      case "MyRecordedReceipts": {
        const issued = state.receipts.filter((r) => r.status === "issued");
        return respond({
          myRecordedReceipts: {
            __typename: "MyRecordedReceipts",
            date: today,
            count: state.receipts.length,
            voidCount: state.receipts.length - issued.length,
            totalAmount: issued.reduce((s, r) => s + Number(r.totalAmount), 0).toFixed(2),
            items: [...state.receipts].reverse(),
          },
        });
      }
      case "RequestReceiptVoid": {
        state.voidRequestCalls.push(variables);
        const receipt = findReceipt(receiptNumber);
        state.voidRequests.push({
          __typename: "ReceiptVoidRequestType",
          id: "900",
          requestedByName: "Rita Recorder",
          reason: String(variables.reason),
          status: "pending",
          decidedByName: null,
          decidedAt: null,
          decisionNote: "",
          createdAt: new Date().toISOString(),
          receipt,
        });
        return respond({
          requestReceiptVoid: {
            __typename: "RequestReceiptVoidResponse",
            success: true,
            message: `Void requested for receipt ${receiptNumber}`,
            receiptNumber,
            voidRequest: { __typename: "ReceiptVoidRequestType", id: "900", status: "pending" },
          },
        });
      }
      case "GetPendingVoidRequestCount":
        return respond({
          voidRequests: state.voidRequests.filter((r) => r.status === "pending").map((r) => ({ id: r.id })),
        });
      case "GetVoidRequests":
        return respond({
          voidRequests: state.voidRequests.filter((r) => !variables.status || r.status === variables.status),
        });
      case "DecideVoidRequest": {
        const req = state.voidRequests.find((r) => r.id === variables.requestId);
        const receipt = req?.receipt as Record<string, unknown> | undefined;
        if (req && receipt && variables.approve) {
          req.status = "approved";
          receipt.status = "void";
          receipt.voidReason = req.reason;
          receipt.voidedAt = new Date().toISOString();
        }
        return respond({
          decideVoidRequest: {
            __typename: "ReceiptVoidResponse",
            success: true,
            message: "Decided",
            receiptNumber: receipt?.number ?? null,
            status: receipt?.status ?? null,
          },
        });
      }
      case "GetReceipts":
        return respond({
          receipts: { __typename: "ReceiptPage", totalCount: state.receipts.length, items: state.receipts },
        });
      case "GetReceipt":
        return respond({
          receipt: findReceipt(String(variables.number)),
          churchProfile: { __typename: "ChurchProfile", displayName: "SDA Church Kawangware" },
        });
      default:
        return respond(null);
    }
  });

  return state;
}

test.describe("Recorder workspace", () => {
  test("record a multi-line cash gift, request a void, treasurer approves", async ({ page }) => {
    test.setTimeout(180_000);
    const state = await interceptGraphQL(page);

    // 1. OTP login (mocked); a pure recorder lands on /record
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel(/phone number/i).fill("711000111");
    await page.getByRole("button", { name: /send verification code/i }).click();
    await expect(page).toHaveURL(/\/verify-otp/, { timeout: 60_000 });
    const firstDigit = page.locator('input[inputmode="numeric"]').first();
    await expect(firstDigit).toBeVisible({ timeout: 60_000 });
    await firstDigit.focus();
    await page.keyboard.type("123456");
    await expect(page).toHaveURL(/\/record$/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Record giving" })).toBeVisible({ timeout: 60_000 });

    // 2. Giver lookup shows the name only
    await page.getByLabel("Phone Number").fill("0712345678");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByTestId("giver-found")).toContainText("Mary Wanjiru");

    // Two lines: Tithe 1,000 + Combined Offering 500
    await page.locator("#category-0").click();
    await page.getByRole("option", { name: /Tithe/ }).click();
    await page.locator("#amount-0").fill("1000");
    await page.getByRole("button", { name: /Add another fund/ }).click();
    await page.locator("#category-1").click();
    await page.getByRole("option", { name: /Combined Offering/ }).click();
    await page.locator("#amount-1").fill("500");
    await expect(page.getByTestId("lines-total")).toContainText("KES 1,500.00");

    // Cash is the default entry type
    await expect(page.getByRole("radio", { name: "Cash" })).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: /Review & save/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByTestId("confirm-total")).toHaveText("KES 1,500.00");
    await sheet.getByRole("button", { name: "Confirm & issue receipt" }).click();

    const number = page.getByTestId("issued-receipt-number");
    await expect(number).toHaveText(/^\d{8}-\d{4}$/);
    const receiptNumber = (await number.textContent())!.trim();
    await expect(page.getByTestId("sms-status")).toContainText("SMS receipt sent");
    await expect(page.getByRole("link", { name: /Print receipt/ })).toHaveAttribute(
      "href",
      `/receipts/${receiptNumber}`
    );
    expect(state.createCalls).toHaveLength(1);
    expect(state.createCalls[0]).toMatchObject({
      entryType: "cash",
      phoneNumber: "0712345678",
      giverName: null,
      contributions: [
        { categoryId: "1", amount: "1000", purposeId: null, memberIdentifier: null },
        { categoryId: "2", amount: "500", purposeId: null, memberIdentifier: null },
      ],
    });
    expect(state.createCalls[0]).not.toHaveProperty("transactionDate");

    // 3. Admin routes send a pure recorder back to /record
    await page.goto("/admin/reports", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/record$/, { timeout: 60_000 });

    // 4. Request a void from today's entries
    await page.getByRole("tab", { name: /Today's entries \(1\)/ }).click();
    const entry = page.getByTestId(`entry-${receiptNumber}`);
    await expect(entry).toContainText("Mary Wanjiru");
    await expect(entry).toContainText("KES 1,500.00");
    await entry.getByRole("button", { name: "Request void" }).click();
    const voidDialog = page.getByRole("dialog");
    await voidDialog.getByLabel("Reason").fill("short");
    await voidDialog.getByRole("button", { name: "Send request" }).click();
    await expect(voidDialog.getByText(/at least 10 characters/)).toBeVisible();
    await voidDialog.getByLabel("Reason").fill("Recorded under the wrong giver");
    await voidDialog.getByRole("button", { name: "Send request" }).click();
    await expect(voidDialog).toBeHidden();
    await expect(entry).toContainText("Void requested");
    expect(state.voidRequestCalls).toEqual([{ receiptNumber, reason: "Recorded under the wrong giver" }]);

    // 5. The treasurer approves it in the void inbox
    state.persona = "treasurer";
    await page.goto("/admin/receipts?tab=void-requests", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: `Approve void request for ${receiptNumber}` })
      .filter({ visible: true })
      .first()
      .click({ timeout: 60_000 });
    await page.getByRole("dialog").getByRole("button", { name: "Approve and void" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // The receipt now shows VOID, on the receipt and in the recorder's list
    await page.goto(`/receipts/${receiptNumber}`, { waitUntil: "networkidle" });
    await expect(page.getByText("This receipt is VOID")).toBeVisible({ timeout: 60_000 });

    state.persona = "recorder";
    await page.goto("/record", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /Today's entries/ }).click();
    const voided = page.getByTestId(`entry-${receiptNumber}`);
    await expect(voided.getByText("VOID", { exact: true })).toBeVisible();
    await expect(voided.getByRole("button", { name: /Resend SMS/ })).toHaveCount(0);
    await expect(voided.getByRole("button", { name: "Request void" })).toHaveCount(0);
  });
});
