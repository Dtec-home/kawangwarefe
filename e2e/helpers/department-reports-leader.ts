/**
 * A small stateful fake of the department reports GraphQL API for the
 * leader's mocked Playwright journey (DR-7). It follows the backend's rules
 * closely enough for the UI: blank items/leaders are dropped, new items get
 * ids, `missing`/`progress` use the registry (02_CONTRACTS.md), submit
 * refuses an incomplete report and freezes the money.
 */

import type { Page } from "@playwright/test";

type Json = Record<string, unknown>;

export const DEPARTMENT = { __typename: "ContributionCategoryType", id: "7", name: "Building Fund", code: "BLDG" };

export const SPECS = [
  { key: "introduction", number: 1, title: "Introduction / Departmental Mission", kind: "text", required: true, minItems: 0, maxItems: 0, maxChars: 1500 },
  { key: "leaders", number: 2, title: "Leaders", kind: "leaders", required: true, minItems: 1, maxItems: 30, maxChars: 0 },
  { key: "objectives", number: 3, title: "Objectives", kind: "list", required: true, minItems: 1, maxItems: 15, maxChars: 500 },
  { key: "achievements", number: 4, title: "Achievements", kind: "list", required: true, minItems: 1, maxItems: 20, maxChars: 500 },
  { key: "challenges", number: 5, title: "Challenges", kind: "list", required: false, minItems: 0, maxItems: 15, maxChars: 500 },
  { key: "recommendations", number: 6, title: "Recommendations", kind: "list", required: false, minItems: 0, maxItems: 15, maxChars: 500 },
  { key: "financial", number: 7, title: "Financial Statement", kind: "financial", required: true, minItems: 0, maxItems: 0, maxChars: 1000 },
  { key: "conclusion", number: 8, title: "Conclusion", kind: "text", required: true, minItems: 0, maxItems: 0, maxChars: 1000 },
].map((s) => ({ __typename: "ReportSectionSpec", ...s }));

function isoDay(offsetDays: number): string {
  const nairobi = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
  const d = new Date(`${nairobi}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** An open period due 12 days from today (Nairobi), so the card says "Due in 12 days". */
export function openPeriod(): Json {
  return {
    __typename: "ReportingPeriod",
    id: "3",
    label: "2026-2027",
    startDate: isoDay(-365),
    endDate: isoDay(-1),
    dueDate: isoDay(12),
    status: "open",
  };
}

export const LAST_PERIOD = {
  __typename: "ReportingPeriod",
  id: "2",
  label: "2025-2026",
  startDate: isoDay(-730),
  endDate: isoDay(-366),
  dueDate: isoDay(-335),
  status: "closed",
};

export function leaderRole(): Json {
  return {
    __typename: "UserRoleType",
    isAuthenticated: true,
    isStaff: false,
    isCategoryAdmin: true,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: false,
    isRecorder: false,
    canVoidReceipts: false,
    isAdmin: false,
    isTreasurer: false,
    adminCategoryIds: ["7"],
    ledDepartmentIds: ["7"],
    isClerk: false,
    adminGroupNames: [],
    adminCategories: [{ __typename: "CategoryType", id: "7", name: "Building Fund", code: "BLDG", description: "" }],
  };
}

interface Item {
  id: string;
  kind: string;
  order: number;
  text: string;
  fulfilsId: string | null;
  carriedFromId: string | null;
}

export interface FakeReport {
  id: string;
  status: string;
  version: number;
  introduction: string;
  conclusion: string;
  financialNote: string;
  leaders: { name: string; roleTitle: string; phone: string; memberId: string | null }[];
  items: Item[];
  lineNotes: Record<string, string>;
  comments: { sectionKey: string; body: string; author: string; createdAt: string; resolved: boolean }[];
}

export interface LeaderApiOptions {
  /** An existing report (e.g. a returned one); none means "Not started". */
  report?: Partial<FakeReport>;
  carryForward?: { id: string; text: string }[];
}

export interface LeaderApi {
  state: { report: FakeReport | null; calls: { operation: string; variables: Json }[] };
}

const LINES = [
  { direction: "in", label: "Roof appeal", amount: "3000.00" },
  { direction: "in", label: "General", amount: "1500.00" },
  { direction: "out", label: "Other", amount: "1200.00" },
];

function missing(r: FakeReport): Json[] {
  const count = (kind: string) => r.items.filter((i) => i.kind === kind).length;
  const out: string[] = [];
  if (!r.introduction.trim()) out.push("introduction");
  if (r.leaders.length < 1) out.push("leaders");
  if (count("objective") < 1) out.push("objectives");
  if (count("achievement") < 1) out.push("achievements");
  if (!r.conclusion.trim()) out.push("conclusion");
  return out.map((key) => ({ __typename: "MissingSection", key, reason: "required" }));
}

function statement(r: FakeReport, frozen: boolean): Json {
  return {
    __typename: "FinancialStatement",
    broughtForward: "1000.00",
    moneyIn: "4500.00",
    moneyOut: "1200.00",
    carriedForward: "4300.00",
    asOf: new Date().toISOString(),
    lines: LINES.map((l) => ({ __typename: "FinancialLine", ...l, note: r.lineNotes[`${l.direction}:${l.label}`] ?? "" })),
    frozen,
    pendingRequisitionCount: 1,
    pendingRequisitionTotal: "800.00",
  };
}

function toGraphQL(r: FakeReport, period: Json, candidates: { id: string; text: string }[]): Json {
  const miss = missing(r);
  const editable = r.status === "draft" || r.status === "returned";
  return {
    __typename: "DepartmentReport",
    id: r.id,
    status: r.status,
    overdue: false,
    version: r.version,
    introduction: r.introduction,
    conclusion: r.conclusion,
    financialNote: r.financialNote,
    leaders: r.leaders.map((l) => ({ __typename: "ReportLeader", ...l })),
    items: r.items.map((i) => ({ __typename: "ReportItem", ...i })),
    missing: miss,
    progress: SPECS.length - miss.length,
    canEdit: editable,
    canSubmit: editable,
    canReview: false,
    canReopen: false,
    period,
    department: DEPARTMENT,
    comments: r.comments.map((c) => ({ __typename: "ReportComment", ...c })),
    financial: statement(r, !editable),
    liveFinancial: null,
    carryForwardCandidates: editable
      ? candidates.map((c, order) => ({ __typename: "ReportItem", id: c.id, kind: "objective", order, text: c.text, fulfilsId: null, carriedFromId: null }))
      : [],
  };
}

const reportError = (code: string, message: string, miss: Json[] = []) => ({
  __typename: "ReportError",
  code,
  message,
  missing: miss,
});

/** Route every GraphQL call of the leader's screens to the fake. Call before `page.goto`. */
export async function installLeaderApi(page: Page, options: LeaderApiOptions = {}): Promise<LeaderApi> {
  const period = openPeriod();
  const candidates = options.carryForward ?? [];
  let nextId = 100;
  const state: LeaderApi["state"] = {
    report: options.report
      ? {
          id: "5",
          status: "draft",
          version: 1,
          introduction: "",
          conclusion: "",
          financialNote: "",
          leaders: [],
          items: [],
          lineNotes: {},
          comments: [],
          ...options.report,
        }
      : null,
    calls: [],
  };

  await page.route(/\/graphql\/?$/, async (route, request) => {
    let operation = "";
    let query = "";
    let variables: Json = {};
    try {
      const body = request.postDataJSON();
      operation = body?.operationName ?? "";
      query = body?.query ?? "";
      variables = body?.variables ?? {};
    } catch {
      /* not JSON */
    }
    const respond = (data: unknown) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data }) });
    state.calls.push({ operation, variables });
    const r = state.report;
    const full = () => (r ? toGraphQL(r, period, candidates) : null);
    const editable = () => !!r && (r.status === "draft" || r.status === "returned");

    if (query.includes("currentUserRole")) return respond({ currentUserRole: leaderRole() });

    switch (operation) {
      case "GetReportingPeriods":
        return respond({ reportingPeriods: [LAST_PERIOD, period] });
      case "GetReportSectionSpecs":
        return respond({ reportSectionSpecs: SPECS });
      case "GetMyDepartmentReports":
        return respond({
          myDepartmentReports: [
            {
              __typename: "TrackerRow",
              department: DEPARTMENT,
              period,
              report: r ? (({ id, status, overdue, progress, version, canEdit, canReview }) => ({ __typename: "DepartmentReport", id, status, overdue, progress, version, canEdit, canReview }))(full() as never) : null,
              status: r ? r.status : "not_started",
              overdue: false,
              progress: r ? (full() as { progress: number }).progress : 0,
              leaderNames: ["Dan Builder"],
            },
          ],
        });
      case "StartDepartmentReport":
        if (!state.report) {
          state.report = {
            id: "5", status: "draft", version: 1, introduction: "", conclusion: "", financialNote: "",
            leaders: [{ name: "Dan Builder", roleTitle: "Department leader", phone: "254700000001", memberId: "9" }],
            items: [], lineNotes: {}, comments: [],
          };
        }
        return respond({ startDepartmentReport: toGraphQL(state.report, period, candidates) });
      case "GetDepartmentReport":
        return respond({ departmentReport: variables.id === r?.id ? full() : null });
      case "SaveReportText": {
        if (!r || !editable()) return respond({ saveReportText: reportError("locked", "Locked.") });
        const key = String(variables.section) as "introduction" | "conclusion";
        r[key] = String(variables.text ?? "").trim();
        return respond({ saveReportText: full() });
      }
      case "SaveReportItems": {
        if (!r || !editable()) return respond({ saveReportItems: reportError("locked", "Locked.") });
        const kind = String(variables.kind);
        const wanted = ((variables.items as Json[]) ?? []).filter((i) => String(i.text ?? "").trim());
        const kept = wanted.map((i, order) => {
          const existing = r.items.find((x) => x.id === i.id && x.kind === kind);
          return {
            id: existing?.id ?? String(nextId++),
            kind,
            order,
            text: String(i.text).trim(),
            fulfilsId: kind === "achievement" ? ((i.fulfilsId as string | null) ?? null) : null,
            carriedFromId: existing?.carriedFromId ?? null,
          };
        });
        r.items = [...r.items.filter((x) => x.kind !== kind), ...kept];
        return respond({ saveReportItems: full() });
      }
      case "SaveReportLeaders": {
        if (!r || !editable()) return respond({ saveReportLeaders: reportError("locked", "Locked.") });
        r.leaders = ((variables.leaders as Json[]) ?? [])
          .filter((l) => String(l.name ?? "").trim())
          .map((l) => ({ name: String(l.name).trim(), roleTitle: String(l.roleTitle ?? ""), phone: String(l.phone ?? ""), memberId: (l.memberId as string | null) ?? null }));
        return respond({ saveReportLeaders: full() });
      }
      case "SaveReportFinancialNotes": {
        if (!r || !editable()) return respond({ saveReportFinancialNotes: reportError("locked", "Locked.") });
        r.financialNote = String(variables.note ?? "");
        for (const line of (variables.lineNotes as Json[]) ?? []) r.lineNotes[`${line.direction}:${line.label}`] = String(line.note ?? "");
        return respond({ saveReportFinancialNotes: full() });
      }
      case "CarryForwardObjectives": {
        if (!r || !editable()) return respond({ carryForwardObjectives: reportError("locked", "Locked.") });
        for (const id of (variables.itemIds as string[]) ?? []) {
          const source = candidates.find((c) => c.id === id);
          if (!source || r.items.some((i) => i.carriedFromId === id)) continue;
          const order = r.items.filter((i) => i.kind === "objective").length;
          r.items.push({ id: String(nextId++), kind: "objective", order, text: source.text, fulfilsId: null, carriedFromId: id });
        }
        return respond({ carryForwardObjectives: full() });
      }
      case "SubmitDepartmentReport": {
        if (!r || !editable()) return respond({ submitDepartmentReport: reportError("invalid_transition", "No.") });
        const miss = missing(r);
        if (miss.length) return respond({ submitDepartmentReport: reportError("incomplete", "Incomplete.", miss) });
        r.status = "submitted";
        r.comments = r.comments.map((c) => ({ ...c, resolved: true }));
        return respond({ submitDepartmentReport: full() });
      }
      default:
        // Layout queries (notifications, tours, ...) don't matter here.
        return respond(null);
    }
  });

  return { state };
}

