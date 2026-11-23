/**
 * Department report fixtures for the leader's screens (DR-7). Shapes follow
 * church_BE/department_reports/api/schema.graphql, with __typename so they
 * can also be written to an Apollo cache through MockedProvider.
 */

import { DEFAULT_SECTION_SPECS } from "@/lib/department-reports/sections";
import type {
  DepartmentReport,
  FinancialStatement,
  ReportComment,
  ReportItem,
  ReportSectionSpec,
  ReportingPeriod,
  TrackerRow,
} from "@/lib/department-reports/types";

/** The specs as the server sends them (lists: 500 chars per item, financial note 1000). */
export const SERVER_SPECS: ReportSectionSpec[] = DEFAULT_SECTION_SPECS.map((spec) => ({
  ...spec,
  maxChars: spec.kind === "list" ? 500 : spec.kind === "financial" ? 1000 : spec.maxChars,
  maxItems: spec.key === "leaders" ? 30 : spec.maxItems,
}));

export const specsWithTypename = SERVER_SPECS.map((s) => ({ __typename: "ReportSectionSpec", ...s }));

export const OPEN_PERIOD: ReportingPeriod = {
  __typename: "ReportingPeriod",
  id: "3",
  label: "2026-2027",
  startDate: "2026-07-01",
  endDate: "2027-06-30",
  dueDate: "2027-07-31",
  status: "open",
};

export const LAST_PERIOD: ReportingPeriod = {
  __typename: "ReportingPeriod",
  id: "2",
  label: "2025-2026",
  startDate: "2025-07-01",
  endDate: "2026-06-30",
  dueDate: "2026-07-31",
  status: "closed",
};

export function item(id: string, kind: ReportItem["kind"], order: number, text: string, extra: Partial<ReportItem> = {}) {
  return { __typename: "ReportItem", id, kind, order, text, fulfilsId: null, carriedFromId: null, ...extra } as ReportItem;
}

export function statement(overrides: Partial<FinancialStatement> = {}): FinancialStatement {
  return {
    __typename: "FinancialStatement",
    broughtForward: "1000.00",
    moneyIn: "4500.00",
    moneyOut: "1200.00",
    carriedForward: "4300.00",
    asOf: "2026-11-23T11:05:00Z",
    lines: [
      { __typename: "FinancialLine", direction: "in", label: "Roof appeal", amount: "3000.00", note: "" },
      { __typename: "FinancialLine", direction: "in", label: "General", amount: "1500.00", note: "" },
      { __typename: "FinancialLine", direction: "out", label: "Other", amount: "1200.00", note: "Paint" },
    ],
    frozen: false,
    pendingRequisitionCount: 0,
    pendingRequisitionTotal: "0.00",
    ...overrides,
  } as FinancialStatement;
}

export const ALL_MISSING = [
  { __typename: "MissingSection", key: "introduction", reason: "required" },
  { __typename: "MissingSection", key: "objectives", reason: "required" },
  { __typename: "MissingSection", key: "achievements", reason: "required" },
  { __typename: "MissingSection", key: "conclusion", reason: "required" },
] as DepartmentReport["missing"];

/** A freshly started report: one leader prefilled, 4 of 8 done. */
export function report(overrides: Partial<DepartmentReport> = {}): DepartmentReport {
  return {
    __typename: "DepartmentReport",
    id: "5",
    status: "draft",
    overdue: false,
    version: 1,
    introduction: "",
    conclusion: "",
    financialNote: "",
    leaders: [{ __typename: "ReportLeader", name: "Dan Builder", roleTitle: "Department leader", phone: "254700000001", memberId: "9" }],
    items: [],
    missing: ALL_MISSING,
    progress: 4,
    canEdit: true,
    canSubmit: true,
    canReview: false,
    canReopen: false,
    period: OPEN_PERIOD,
    department: { __typename: "ContributionCategoryType", id: "7", name: "Building Fund", code: "BLDG" },
    comments: [],
    financial: statement(),
    liveFinancial: null,
    carryForwardCandidates: [],
    ...overrides,
  } as DepartmentReport;
}

/** Every required section filled in: nothing missing, 8 of 8. */
export function completeReport(overrides: Partial<DepartmentReport> = {}): DepartmentReport {
  return report({
    introduction: "We look after the church buildings.",
    conclusion: "Thank you to every giver.",
    items: [
      item("11", "objective", 0, "Repair the roof"),
      item("21", "achievement", 0, "Roof repaired in March", { fulfilsId: "11" }),
    ],
    missing: [],
    progress: 8,
    ...overrides,
  });
}

export function comment(sectionKey: ReportComment["sectionKey"], body: string): ReportComment {
  return {
    __typename: "ReportComment",
    sectionKey,
    body,
    author: "Pastor Paul",
    createdAt: "2026-11-20T09:00:00Z",
    resolved: false,
  } as ReportComment;
}

export function trackerRow(overrides: Partial<TrackerRow> = {}): TrackerRow {
  return {
    __typename: "TrackerRow",
    department: { __typename: "ContributionCategoryType", id: "7", name: "Building Fund", code: "BLDG" },
    report: null,
    status: "not_started",
    overdue: false,
    progress: 0,
    leaderNames: ["Dan Builder"],
    ...overrides,
  } as TrackerRow;
}

const DRAFT_KEYS = [
  "__typename", "id", "status", "overdue", "version", "introduction", "conclusion", "financialNote",
  "leaders", "items", "missing", "progress", "canEdit", "canSubmit", "canReview", "canReopen",
] as const;

/** What an autosave mutation returns: the draft fields only (no money, period, comments). */
export function draftFields(r: DepartmentReport): Record<string, unknown> {
  return Object.fromEntries(DRAFT_KEYS.map((key) => [key, r[key]]));
}
