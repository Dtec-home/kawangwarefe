/**
 * Mocked-GraphQL fake for Fund transfers (FT-2) and "Move gift…" (RA-2).
 *
 * `fakeFundTransfers(page, { persona })` signs a fake user in (injectSession
 * without its role mock) and answers every GraphQL request from a small
 * stateful fake: departments, purposes, available balances that move with
 * approved transfers, the four-eyes transfer mutations, the contributions list
 * and the reallocation preview/apply. Only the Next dev server is needed.
 */

import type { Page } from "@playwright/test";
import { injectSession } from "./auth";

export type TransferPersona = "treasurer" | "admin" | "pastor" | "leader" | "member" | "recorder";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

const USERS: Record<TransferPersona, { id: number; name: string }> = {
  treasurer: { id: 1, name: "Grace Treasurer" },
  admin: { id: 2, name: "Peter Admin" },
  pastor: { id: 3, name: "Pastor John" },
  leader: { id: 4, name: "Youth Leader" },
  member: { id: 5, name: "Mary Member" },
  recorder: { id: 6, name: "Rita Recorder" },
};

function roleFor(persona: TransferPersona) {
  const staff = persona === "admin" || persona === "pastor" || persona === "treasurer";
  return {
    __typename: "UserRoleInfo",
    isAuthenticated: true,
    isStaff: staff,
    isCategoryAdmin: persona === "leader",
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: staff,
    isRecorder: persona === "recorder",
    canVoidReceipts: persona === "admin" || persona === "treasurer",
    isAdmin: persona === "admin",
    isTreasurer: persona === "treasurer",
    adminCategoryIds: persona === "leader" ? ["1"] : [],
    ledDepartmentIds: persona === "leader" ? ["1"] : [],
    isClerk: false,
    adminGroupNames: [],
    adminCategories: [],
  };
}

const dept = (id: string, name: string) => ({
  __typename: "ContributionCategoryType",
  id,
  name,
  code: name.slice(0, 4).toUpperCase(),
  description: "",
  isActive: true,
  routingMode: "none",
  fallbackIfNoGroup: "top_level",
  audience: "both",
  hasAutoSplit: false,
  tracksMemberIdentifier: false,
  identifierLabel: "",
  identifierFormat: "",
  allowedGroups: [],
});

const DEPARTMENTS = [dept("1", "Youth"), dept("2", "Building Fund"), dept("3", "Tithe")];
const PURPOSES: Record<string, { id: string; name: string }[]> = { "1": [], "2": [{ id: "8", name: "Roof" }], "3": [] };

type Transfer = {
  id: string;
  from: string;
  fromPurpose: string | null;
  to: string;
  toPurpose: string | null;
  amount: number;
  transferDate: string;
  reason: string;
  status: "requested" | "approved" | "rejected" | "cancelled";
  requesterId: number;
  requestedBy: string;
  decidedBy: string | null;
  decisionNote: string;
};

type Line = { id: string; category: string; purpose: string | null; amount: number };

export interface FakeState {
  persona: TransferPersona;
  /** Opening balances (department, or "dept/purpose"), in KES. */
  balances: Record<string, number>;
  transfers: Transfer[];
  payment: Line[];
  reallocationReasons: string[];
  calls: Array<{ op: string; variables: Record<string, unknown> }>;
}

export interface FakeOptions {
  persona: TransferPersona;
  /** Start with a transfer requested by this persona. */
  requestedBy?: TransferPersona;
}

const ref = (id: string) => {
  const d = DEPARTMENTS.find((x) => x.id === id)!;
  return { __typename: "ContributionCategoryType", id: d.id, name: d.name, code: d.code };
};
const purposeRef = (id: string | null) => {
  if (!id) return null;
  const p = Object.values(PURPOSES).flat().find((x) => x.id === id)!;
  return { __typename: "DepartmentPurposeType", id: p.id, name: p.name, code: p.name.toUpperCase() };
};
const fundName = (deptId: string, purposeId: string | null) =>
  ref(deptId).name + (purposeId ? ` / ${purposeRef(purposeId)!.name}` : "");

function available(state: FakeState, deptId: string, purposeId: string | null): number {
  const key = purposeId ? `${deptId}/${purposeId}` : deptId;
  let total = state.balances[key] ?? 0;
  for (const t of state.transfers.filter((x) => x.status === "approved")) {
    const fromMatch = t.from === deptId && (!purposeId || t.fromPurpose === purposeId);
    const toMatch = t.to === deptId && (!purposeId || t.toPurpose === purposeId);
    if (fromMatch) total -= t.amount;
    if (toMatch) total += t.amount;
  }
  return total;
}

function transferPayload(state: FakeState, t: Transfer) {
  const me = USERS[state.persona];
  const approver = state.persona === "treasurer" || state.persona === "admin";
  return {
    __typename: "FundTransfer",
    id: t.id,
    fromDepartment: ref(t.from),
    fromPurpose: purposeRef(t.fromPurpose),
    toDepartment: ref(t.to),
    toPurpose: purposeRef(t.toPurpose),
    amount: t.amount.toFixed(2),
    transferDate: t.transferDate,
    reason: t.reason,
    status: t.status,
    requestedBy: t.requestedBy,
    decidedBy: t.decidedBy,
    decidedAt: t.decidedBy ? "2026-11-21T09:00:00Z" : null,
    decisionNote: t.decisionNote,
    canApprove: t.status === "requested" && approver && t.requesterId !== me.id,
    canCancel: t.status === "requested" && t.requesterId === me.id,
  };
}

function contributionRows(state: FakeState) {
  return state.payment.map((l) => ({
    __typename: "ContributionType",
    id: l.id,
    amount: l.amount.toFixed(2),
    status: "completed",
    channel: "paybill",
    transactionDate: "2026-11-20T08:00:00Z",
    notes: null,
    manualReceiptNumber: null,
    receiptNumber: "20261120-0001",
    routedGroupName: null,
    purposeName: l.purpose ? purposeRef(l.purpose)!.name : null,
    departmentMemberIdentifier: null,
    contributionGroupId: "3f1c9a6e-0000-4000-8000-000000000001",
    member: { __typename: "MemberType", id: "m1", fullName: "John Kamau", phoneNumber: "254712345678", memberNumber: null },
    category: ref(l.category),
    mpesaTransaction: null,
  }));
}

const lineOut = (deptId: string, purposeId: string | null, amount: number) => ({
  __typename: "ReallocationLine",
  department: ref(deptId).name,
  purpose: purposeId ? purposeRef(purposeId)!.name : null,
  amount: amount.toFixed(2),
});

export async function fakeFundTransfers(page: Page, options: FakeOptions): Promise<FakeState> {
  const state: FakeState = {
    persona: options.persona,
    balances: { "1": 8000, "2": 20000, "3": 50000, "2/8": 3000 },
    transfers: [],
    payment: [{ id: "c1", category: "3", purpose: null, amount: 1000 }],
    reallocationReasons: [],
    calls: [],
  };
  if (options.requestedBy) {
    const by = USERS[options.requestedBy];
    state.transfers.push({
      id: "10",
      from: "1",
      fromPurpose: null,
      to: "2",
      toPurpose: "8",
      amount: 5000,
      transferDate: "2026-11-20",
      reason: "Youth surplus to the roof",
      status: "requested",
      requesterId: by.id,
      requestedBy: by.name,
      decidedBy: null,
      decisionNote: "",
    });
  }

  const signedIn = USERS[options.persona];
  await injectSession(page, { userId: signedIn.id, fullName: signedIn.name });

  await page.route(/\/graphql\/?$/, async (route, request) => {
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    let q = "";
    let op = "";
    let variables: Record<string, unknown> = {};
    try {
      const body = request.postDataJSON();
      q = body?.query ?? "";
      op = body?.operationName ?? "";
      variables = body?.variables ?? {};
    } catch {
      /* not JSON */
    }
    const respond = (data: unknown) =>
      route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ data }) });
    const refused = (message: string) =>
      route.fulfill({
        status: 200,
        headers: CORS,
        contentType: "application/json",
        body: JSON.stringify({ data: null, errors: [{ message }] }),
      });

    if (q.includes("currentUserRole")) return respond({ currentUserRole: roleFor(state.persona) });
    if (op) state.calls.push({ op, variables });

    const persona = state.persona;
    const me = USERS[persona];
    const staff = persona === "admin" || persona === "pastor" || persona === "treasurer";
    const mayEnter = staff || persona === "leader";
    const approver = persona === "admin" || persona === "treasurer";
    const fail = (code: string, message = "") => ({ __typename: "FundTransferError", code, message });
    const findTransfer = () => state.transfers.find((t) => t.id === String(variables.id));

    switch (op) {
      case "GetContributionCategories":
      case "GetGivingCategories":
        return respond({ contributionCategories: DEPARTMENTS });
      case "GetDepartmentPurposes": {
        const list = PURPOSES[String(variables.categoryId)] ?? [];
        return respond({
          departmentPurposes: list.map((p) => ({
            __typename: "DepartmentPurposeType",
            id: p.id,
            name: p.name,
            code: p.name.toUpperCase(),
            description: "",
            isActive: true,
          })),
        });
      }
      case "GetFundTransfers": {
        if (!mayEnter) return refused("You are not allowed to use fund transfers: staff and department leaders only.");
        const status = variables.status as string | null;
        const departmentId = variables.departmentId as string | null;
        const list = state.transfers
          .filter((t) => staff || t.from === "1" || t.to === "1")
          .filter((t) => !status || t.status === status)
          .filter((t) => !departmentId || t.from === departmentId || t.to === departmentId)
          .slice()
          .reverse();
        return respond({ fundTransfers: list.map((t) => transferPayload(state, t)) });
      }
      case "GetFundAvailableBalance": {
        if (!mayEnter) return refused("Not allowed");
        const value = available(state, String(variables.departmentId), (variables.purposeId as string | null) ?? null);
        return respond({ fundAvailableBalance: value.toFixed(2) });
      }
      case "RequestFundTransfer": {
        const input = variables.input as Record<string, string | null>;
        const amount = Number(input.amount);
        const fromPurpose = input.fromPurposeId ?? null;
        if (!approver && !(persona === "leader" && input.fromDepartmentId === "1")) {
          return respond({ requestFundTransfer: fail("forbidden") });
        }
        if (available(state, input.fromDepartmentId!, fromPurpose) < amount) {
          return respond({ requestFundTransfer: fail("insufficient_funds") });
        }
        const t: Transfer = {
          id: String(20 + state.transfers.length),
          from: input.fromDepartmentId!,
          fromPurpose,
          to: input.toDepartmentId!,
          toPurpose: input.toPurposeId ?? null,
          amount,
          transferDate: input.transferDate!,
          reason: input.reason!,
          status: "requested",
          requesterId: me.id,
          requestedBy: me.name,
          decidedBy: null,
          decisionNote: "",
        };
        state.transfers.push(t);
        return respond({ requestFundTransfer: transferPayload(state, t) });
      }
      case "ApproveFundTransfer":
      case "RejectFundTransfer":
      case "CancelFundTransfer": {
        const t = findTransfer();
        const field = op.charAt(0).toLowerCase() + op.slice(1);
        if (!t) return respond({ [field]: fail("not_found") });
        if (t.status !== "requested") return respond({ [field]: fail("invalid_transition") });
        if (op === "CancelFundTransfer") {
          if (t.requesterId !== me.id) return respond({ [field]: fail("forbidden") });
          t.status = "cancelled";
        } else {
          if (!approver || t.requesterId === me.id) return respond({ [field]: fail("forbidden") });
          if (op === "ApproveFundTransfer" && available(state, t.from, t.fromPurpose) < t.amount) {
            return respond({ [field]: fail("insufficient_funds") });
          }
          t.status = op === "ApproveFundTransfer" ? "approved" : "rejected";
          t.decidedBy = me.name;
          t.decisionNote = String(variables.note ?? "");
        }
        return respond({ [field]: transferPayload(state, t) });
      }
      case "GetAllContributions":
        return respond({
          allContributions: { __typename: "ContributionList", items: contributionRows(state), total: state.payment.length, hasMore: false },
        });
      case "GetPaymentLines":
        if (!approver) return refused("Not allowed: only a treasurer or an admin can move a gift.");
        return respond({
          paymentLines: state.payment.map((l) => ({
            __typename: "PaymentLine",
            departmentId: l.category,
            department: ref(l.category).name,
            purposeId: l.purpose,
            purpose: l.purpose ? purposeRef(l.purpose)!.name : null,
            amount: l.amount.toFixed(2),
          })),
        });
      case "PreviewPaymentReallocation":
      case "ReallocatePayment": {
        const field = op === "ReallocatePayment" ? "reallocatePayment" : "previewPaymentReallocation";
        if (!approver) return refused("Not allowed: only a treasurer or an admin can move a gift.");
        const targets = variables.targets as { departmentId: string; purposeId: string | null; amount: string }[];
        const total = state.payment.reduce((s, l) => s + l.amount, 0);
        const sum = targets.reduce((s, t) => s + Number(t.amount), 0);
        const base = { __typename: "ReallocationPreview", total: "0.00", before: [], after: [] };
        if (Math.round(sum * 100) !== Math.round(total * 100)) {
          return respond({ [field]: { ...base, ok: false, code: "total_mismatch", message: "mismatch" } });
        }
        const before = state.payment.map((l) => lineOut(l.category, l.purpose, l.amount));
        const after = targets.map((t) => lineOut(t.departmentId, t.purposeId, Number(t.amount)));
        if (op === "ReallocatePayment") {
          state.reallocationReasons.push(String(variables.reason));
          state.payment = targets.map((t, i) => ({
            id: `c${i + 10}`,
            category: t.departmentId,
            purpose: t.purposeId,
            amount: Number(t.amount),
          }));
        }
        return respond({
          [field]: {
            __typename: "ReallocationPreview",
            ok: true,
            code: null,
            message: op === "ReallocatePayment" ? "Gift moved." : "Preview only. Nothing changed.",
            total: total.toFixed(2),
            before,
            after,
          },
        });
      }
      default:
        // Anything else the layout or page asks for: empty, so nothing hangs on a backend.
        return respond(null);
    }
  });

  return state;
}

/** Switch the signed-in persona mid-test (the role query is re-asked on reload). */
export function signInAs(state: FakeState, persona: TransferPersona) {
  state.persona = persona;
}

export { fundName };
