/**
 * Object mothers for the DR-8 staff screens: GraphQL-shaped data (with
 * __typename) that satisfies the DepartmentReportFields / TrackerRowFields
 * fragments, so MockedProvider answers without missing-field warnings.
 */

import type {
  DepartmentReport,
  FinancialStatement,
  ReportingPeriod,
  TrackerRow,
} from "@/lib/department-reports/types";

export function makePeriod(overrides: Partial<ReportingPeriod> = {}): ReportingPeriod {
  return {
    __typename: "ReportingPeriod",
    id: "1",
    label: "2025-2026",
    startDate: "2025-07-01",
    endDate: "2026-06-30",
    dueDate: "2026-07-31",
    status: "open",
    ...overrides,
  };
}

export function makeStatement(overrides: Partial<FinancialStatement> = {}): FinancialStatement {
  return {
    __typename: "FinancialStatement",
    broughtForward: "1000.00",
    moneyIn: "5000.00",
    moneyOut: "2000.00",
    carriedForward: "4000.00",
    asOf: "2026-07-20T07:00:00Z",
    lines: [],
    frozen: true,
    pendingRequisitionCount: 0,
    pendingRequisitionTotal: "0.00",
    ...overrides,
  } as FinancialStatement;
}

export function makeReport(overrides: Partial<DepartmentReport> = {}): DepartmentReport {
  return {
    __typename: "DepartmentReport",
    id: "5",
    status: "submitted",
    overdue: false,
    version: 1,
    introduction: "We serve the youth.",
    conclusion: "Thank you.",
    financialNote: "",
    leaders: [],
    items: [],
    missing: [],
    progress: 8,
    canEdit: false,
    canSubmit: false,
    canReview: false,
    canReopen: false,
    period: makePeriod(),
    department: { __typename: "ContributionCategoryType", id: "7", name: "Building Fund", code: "BUILD" } as DepartmentReport["department"],
    comments: [],
    financial: makeStatement(),
    liveFinancial: null,
    carryForwardCandidates: [],
    ...overrides,
  } as DepartmentReport;
}

let rowSeq = 0;

export function makeRow(
  name: string,
  status: TrackerRow["status"],
  overrides: Partial<TrackerRow> = {},
): TrackerRow {
  rowSeq += 1;
  const deptId = overrides.department?.id ?? String(100 + rowSeq);
  const reportId = String(500 + rowSeq);
  const overdue = overrides.overdue ?? false;
  return {
    __typename: "TrackerRow",
    department: { __typename: "ContributionCategoryType", id: deptId, name, code: name.toUpperCase().slice(0, 5) },
    report:
      status === "not_started"
        ? null
        : {
            __typename: "DepartmentReport",
            id: reportId,
            status,
            overdue,
            progress: status === "draft" ? 4 : 8,
            version: 1,
            canEdit: false,
            canReview: status === "submitted",
          },
    status,
    overdue,
    progress: status === "not_started" ? 0 : status === "draft" ? 4 : 8,
    leaderNames: ["Jane Wanjiru"],
    ...overrides,
  } as TrackerRow;
}

export const reportResponse = (filename: string, contentType = "application/pdf") => ({
  __typename: "ReportResponse",
  success: true,
  message: "ok",
  fileData: "QUJD",
  filename,
  contentType,
});
