/**
 * Mocked-GraphQL fake for the DR-8 staff screens (department reports).
 *
 * `fakeDepartmentReports(page, { persona })` signs a fake user in (via
 * injectSession, without its built-in role mock) and answers every GraphQL
 * request from a small stateful fake: periods, the tracker, one report, the
 * review mutations and the exports. Only the Next dev server is needed.
 */

import type { Page } from "@playwright/test";
import { injectSession } from "./auth";

export type StaffPersona = "admin" | "pastor" | "treasurer" | "member" | "recorder";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

function roleFor(persona: StaffPersona) {
  const staff = persona === "admin" || persona === "pastor" || persona === "treasurer";
  return {
    __typename: "UserRoleInfo",
    isAuthenticated: true,
    isStaff: staff,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: staff,
    isRecorder: persona === "recorder",
    canVoidReceipts: persona === "admin" || persona === "treasurer",
    isAdmin: persona === "admin",
    isTreasurer: persona === "treasurer",
    adminCategoryIds: [],
    ledDepartmentIds: [],
    adminGroupNames: [],
    adminCategories: [],
  };
}

const SECTION_SPECS = [
  ["introduction", "Introduction / Departmental Mission", "text", true, 0, 0, 1500],
  ["leaders", "Leaders", "leaders", true, 1, 0, 0],
  ["objectives", "Objectives", "list", true, 1, 15, 0],
  ["achievements", "Achievements", "list", true, 1, 20, 0],
  ["challenges", "Challenges", "list", false, 0, 15, 0],
  ["recommendations", "Recommendations", "list", false, 0, 15, 0],
  ["financial", "Financial Statement", "financial", true, 0, 0, 0],
  ["conclusion", "Conclusion", "text", true, 0, 0, 1000],
].map(([key, title, kind, required, minItems, maxItems, maxChars], i) => ({
  __typename: "ReportSectionSpec",
  key,
  number: i + 1,
  title,
  kind,
  required,
  minItems,
  maxItems,
  maxChars,
}));

type Period = {
  __typename: "ReportingPeriod";
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: "open" | "closed";
};

type Dept = { __typename: "ContributionCategoryType"; id: string; name: string; code: string };

type ReportState = {
  id: string;
  dept: Dept;
  status: "draft" | "submitted" | "returned" | "approved";
  overdue: boolean;
  progress: number;
  version: number;
};

const dept = (id: string, name: string): Dept => ({
  __typename: "ContributionCategoryType",
  id,
  name,
  code: name.slice(0, 5).toUpperCase(),
});

function statement(moneyIn: string, carriedForward: string, frozen: boolean) {
  return {
    __typename: "FinancialStatement",
    broughtForward: "1000.00",
    moneyIn,
    moneyOut: "2000.00",
    carriedForward,
    asOf: "2026-07-20T07:00:00Z",
    lines: [],
    frozen,
    pendingRequisitionCount: 0,
    pendingRequisitionTotal: "0.00",
  };
}

export interface FakeOptions {
  persona: StaffPersona;
  /** Start with no periods at all (US-1 empty state). */
  noPeriods?: boolean;
  /** A late gift after submission, visible to staff as liveFinancial (US-15). */
  lateGift?: boolean;
}

export interface FakeState {
  persona: StaffPersona;
  periods: Period[];
  reports: ReportState[];
  leaders: Record<string, string[]>;
  calls: Array<{ op: string; variables: Record<string, unknown> }>;
  lateGift: boolean;
}

function reportPayload(state: FakeState, r: ReportState, period: Period) {
  const persona = state.persona;
  const staff = persona === "admin" || persona === "pastor" || persona === "treasurer";
  const frozen = r.status === "submitted" || r.status === "approved";
  return {
    __typename: "DepartmentReport",
    id: r.id,
    status: r.status,
    overdue: r.overdue,
    version: r.version,
    introduction: "We look after the church building.",
    conclusion: "Thank you.",
    financialNote: "",
    leaders: [{ __typename: "ReportLeader", name: "Jane Wanjiru", roleTitle: "Leader", phone: "", memberId: null }],
    items: [],
    missing: [],
    progress: r.progress,
    canEdit: false,
    canSubmit: false,
    canReview: r.status === "submitted" && (persona === "admin" || persona === "pastor"),
    canReopen: r.status === "approved" && persona === "admin",
    period,
    department: r.dept,
    comments: [],
    financial: statement("5000.00", "4000.00", frozen),
    liveFinancial:
      frozen && staff ? (state.lateGift ? statement("5500.00", "4500.00", false) : statement("5000.00", "4000.00", false)) : null,
    carryForwardCandidates: [],
  };
}

function trackerRows(state: FakeState, period: Period) {
  const all = [dept("11", "Building Fund"), dept("12", "Welfare"), dept("13", "Choir"), dept("14", "Ushers")];
  return all
    .map((d) => {
      const r = state.reports.find((x) => x.dept.id === d.id);
      const status = r?.status ?? "not_started";
      const overdue = r ? r.overdue : d.name === "Welfare";
      return {
        __typename: "TrackerRow",
        department: d,
        period,
        report: r
          ? {
              __typename: "DepartmentReport",
              id: r.id,
              status: r.status,
              overdue: r.overdue,
              progress: r.progress,
              version: r.version,
              canEdit: false,
              canReview: reportPayload(state, r, period).canReview,
            }
          : null,
        status,
        overdue,
        progress: r?.progress ?? 0,
        leaderNames: state.leaders[d.id] ?? [],
      };
    })
    .filter((row) => row.department.name !== "Ushers" || state.reports.some((r) => r.dept.id === "14"));
}

const fileResponse = (filename: string, contentType: string) => ({
  __typename: "ReportResponse",
  success: true,
  message: "ok",
  fileData: Buffer.from(`fake ${filename}`).toString("base64"),
  filename,
  contentType,
});

export async function fakeDepartmentReports(page: Page, options: FakeOptions): Promise<FakeState> {
  const state: FakeState = {
    persona: options.persona,
    lateGift: !!options.lateGift,
    periods: options.noPeriods
      ? []
      : [
          {
            __typename: "ReportingPeriod",
            id: "1",
            label: "2025-2026",
            startDate: "2025-07-01",
            endDate: "2026-06-30",
            dueDate: "2026-07-31",
            status: "open",
          },
        ],
    reports: [
      { id: "5", dept: dept("11", "Building Fund"), status: "submitted", overdue: false, progress: 8, version: 1 },
      { id: "6", dept: dept("13", "Choir"), status: "draft", overdue: true, progress: 4, version: 1 },
    ],
    leaders: { "11": ["Jane Wanjiru"], "13": ["Peter Otieno"], "14": ["Mary Akinyi"] },
    calls: [],
  };

  await injectSession(page, { fullName: `Test ${options.persona}` });

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
    const notAllowed = () =>
      route.fulfill({
        status: 200,
        headers: CORS,
        contentType: "application/json",
        body: JSON.stringify({ data: null, errors: [{ message: "You are not allowed to see department reports." }] }),
      });

    if (q.includes("currentUserRole")) return respond({ currentUserRole: roleFor(state.persona) });
    if (op) state.calls.push({ op, variables });

    const staff = ["admin", "pastor", "treasurer"].includes(state.persona);
    const period = () => state.periods.find((p) => p.id === String(variables.periodId ?? "1")) ?? state.periods[0];
    const findReport = () => state.reports.find((r) => r.id === String(variables.id));

    switch (op) {
      case "GetReportSectionSpecs":
        return respond({ reportSectionSpecs: SECTION_SPECS });
      case "GetReportingPeriods":
        return staff ? respond({ reportingPeriods: state.periods }) : notAllowed();
      case "OpenReportingPeriod": {
        const input = variables.input as Omit<Period, "__typename" | "id" | "status">;
        if (state.persona !== "admin") {
          return respond({ openReportingPeriod: { __typename: "ReportError", code: "forbidden", message: "", missing: [] } });
        }
        if (state.periods.some((p) => p.status === "open")) {
          return respond({
            openReportingPeriod: { __typename: "ReportError", code: "period_already_open", message: "", missing: [] },
          });
        }
        const created: Period = { __typename: "ReportingPeriod", id: String(state.periods.length + 1), status: "open", ...input };
        state.periods.push(created);
        return respond({ openReportingPeriod: created });
      }
      case "UpdateReportingPeriod": {
        const p = state.periods.find((x) => x.id === String(variables.id))!;
        Object.assign(p, variables.input);
        return respond({ updateReportingPeriod: p });
      }
      case "CloseReportingPeriod": {
        const p = state.periods.find((x) => x.id === String(variables.id))!;
        p.status = "closed";
        return respond({ closeReportingPeriod: p });
      }
      case "GetDepartmentReportTracker":
        return staff ? respond({ departmentReportTracker: trackerRows(state, period()) }) : notAllowed();
      case "GetDepartmentReport": {
        const r = findReport();
        return respond({ departmentReport: r ? reportPayload(state, r, state.periods[0]) : null });
      }
      case "ReturnDepartmentReport":
      case "ApproveDepartmentReport":
      case "ReopenDepartmentReport": {
        const r = findReport()!;
        r.status = op === "ReturnDepartmentReport" ? "returned" : op === "ApproveDepartmentReport" ? "approved" : "draft";
        if (op === "ReopenDepartmentReport") r.version += 1;
        const field = op.charAt(0).toLowerCase() + op.slice(1);
        return respond({ [field]: reportPayload(state, r, state.periods[0]) });
      }
      case "ExportDepartmentReport": {
        const r = findReport()!;
        const name = r.dept.name.replace(/ /g, "-");
        const docx = variables.format === "docx";
        return respond({
          exportDepartmentReport: fileResponse(
            `${name}-Department-Report-${state.periods[0].label}.${docx ? "docx" : "pdf"}`,
            docx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf",
          ),
        });
      }
      case "ExportReportBook":
        return respond({ exportReportBook: fileResponse(`Department-Reports-${period().label}.pdf`, "application/pdf") });
      default:
        // Anything else the layout asks for: empty, so nothing hangs on a backend.
        return respond(null);
    }
  });

  return state;
}

/** Mark the Ushers report approved (so the AGM book is available). */
export function approveUshers(state: FakeState) {
  state.reports.push({ id: "8", dept: dept("14", "Ushers"), status: "approved", overdue: false, progress: 8, version: 1 });
}
