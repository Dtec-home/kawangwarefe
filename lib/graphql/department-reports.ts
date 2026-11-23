/**
 * Yearly department reports GraphQL documents (DEPARTMENT_REPORTS, DR-6).
 *
 * Hand-written against the frozen contract in DEPARTMENT_REPORTS/02_CONTRACTS.md
 * § GraphQL and typed with lib/department-reports/types.ts. Mutations return
 * `DepartmentReportResult` / `ReportingPeriodResult` unions, resolved through
 * `__typename` (`isReportError`, `unwrapReportResult`).
 *
 * The autosave mutations select `DepartmentReportDraftFields` only: the money
 * statement is recomputed on read, so it is not fetched on every keystroke.
 */

import { gql, type TypedDocumentNode } from "@apollo/client";

import type {
  DepartmentReport,
  DepartmentReportDraft,
  DepartmentReportResult,
  FinancialNotesValue,
  ReportCommentInput,
  ReportError,
  ReportExportFormat,
  ReportItemInput,
  ReportItemKind,
  ReportLeaderInput,
  ReportResponse,
  ReportSectionSpec,
  ReportingPeriod,
  ReportingPeriodInput,
  ReportingPeriodResult,
  TrackerRow,
} from "@/lib/department-reports/types";

// ── Fragments ────────────────────────────────────────────────────────────

export const REPORTING_PERIOD_FIELDS = gql`
  fragment ReportingPeriodFields on ReportingPeriod {
    id
    label
    startDate
    endDate
    dueDate
    status
  }
`;

export const FINANCIAL_STATEMENT_FIELDS = gql`
  fragment FinancialStatementFields on FinancialStatement {
    broughtForward
    moneyIn
    moneyOut
    carriedForward
    asOf
    lines {
      direction
      label
      amount
      note
    }
    frozen
    pendingRequisitionCount
    pendingRequisitionTotal
  }
`;

export const REPORT_ITEM_FIELDS = gql`
  fragment ReportItemFields on ReportItem {
    id
    kind
    order
    text
    fulfilsId
    carriedFromId
  }
`;

export const DEPARTMENT_REPORT_DRAFT_FIELDS = gql`
  fragment DepartmentReportDraftFields on DepartmentReport {
    id
    status
    overdue
    version
    introduction
    conclusion
    financialNote
    leaders {
      name
      roleTitle
      phone
      memberId
    }
    items {
      ...ReportItemFields
    }
    missing {
      key
      reason
    }
    progress
    canEdit
    canSubmit
    canReview
    canReopen
  }
  ${REPORT_ITEM_FIELDS}
`;

export const DEPARTMENT_REPORT_FIELDS = gql`
  fragment DepartmentReportFields on DepartmentReport {
    ...DepartmentReportDraftFields
    period {
      ...ReportingPeriodFields
    }
    department {
      id
      name
      code
    }
    comments {
      sectionKey
      body
      author
      createdAt
      resolved
    }
    financial {
      ...FinancialStatementFields
    }
    liveFinancial {
      ...FinancialStatementFields
    }
    carryForwardCandidates {
      ...ReportItemFields
    }
  }
  ${DEPARTMENT_REPORT_DRAFT_FIELDS}
  ${REPORTING_PERIOD_FIELDS}
  ${FINANCIAL_STATEMENT_FIELDS}
`;

export const TRACKER_ROW_FIELDS = gql`
  fragment TrackerRowFields on TrackerRow {
    department {
      id
      name
      code
    }
    period {
      ...ReportingPeriodFields
    }
    report {
      id
      status
      overdue
      progress
      version
      canEdit
      canReview
    }
    status
    overdue
    progress
    leaderNames
  }
  ${REPORTING_PERIOD_FIELDS}
`;

export const REPORT_ERROR_FIELDS = gql`
  fragment ReportErrorFields on ReportError {
    code
    message
    missing {
      key
      reason
    }
  }
`;

const REPORT_RESPONSE_FIELDS = `
  success
  message
  fileData
  filename
  contentType
`;

// ── Result helpers ───────────────────────────────────────────────────────

export function isReportError(value: { __typename?: string } | null | undefined): value is ReportError {
  return value?.__typename === "ReportError";
}

/** Split a union result into the report or the error (both null when absent). */
export function unwrapReportResult<R extends DepartmentReportDraft>(
  result: DepartmentReportResult<R> | null | undefined,
): { report: R | null; error: ReportError | null } {
  if (!result) return { report: null, error: null };
  if (isReportError(result)) return { report: null, error: result };
  return { report: result, error: null };
}

// ── Queries ──────────────────────────────────────────────────────────────

export const GET_REPORT_SECTION_SPECS: TypedDocumentNode<
  { reportSectionSpecs: ReportSectionSpec[] },
  Record<string, never>
> = gql`
  query GetReportSectionSpecs {
    reportSectionSpecs {
      key
      number
      title
      kind
      required
      minItems
      maxItems
      maxChars
    }
  }
`;

export const GET_REPORTING_PERIODS: TypedDocumentNode<
  { reportingPeriods: ReportingPeriod[] },
  Record<string, never>
> = gql`
  query GetReportingPeriods {
    reportingPeriods {
      ...ReportingPeriodFields
    }
  }
  ${REPORTING_PERIOD_FIELDS}
`;

/** Defaults to the open period when `periodId` is omitted. */
export const GET_MY_DEPARTMENT_REPORTS: TypedDocumentNode<
  { myDepartmentReports: TrackerRow[] },
  { periodId?: string | null }
> = gql`
  query GetMyDepartmentReports($periodId: ID) {
    myDepartmentReports(periodId: $periodId) {
      ...TrackerRowFields
    }
  }
  ${TRACKER_ROW_FIELDS}
`;

export const GET_DEPARTMENT_REPORT: TypedDocumentNode<
  { departmentReport: DepartmentReport | null },
  { id: string }
> = gql`
  query GetDepartmentReport($id: ID!) {
    departmentReport(id: $id) {
      ...DepartmentReportFields
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
`;

export const GET_DEPARTMENT_REPORT_TRACKER: TypedDocumentNode<
  { departmentReportTracker: TrackerRow[] },
  { periodId: string }
> = gql`
  query GetDepartmentReportTracker($periodId: ID!) {
    departmentReportTracker(periodId: $periodId) {
      ...TrackerRowFields
    }
  }
  ${TRACKER_ROW_FIELDS}
`;

export const EXPORT_DEPARTMENT_REPORT: TypedDocumentNode<
  { exportDepartmentReport: ReportResponse },
  { id: string; format: ReportExportFormat }
> = gql`
  query ExportDepartmentReport($id: ID!, $format: String!) {
    exportDepartmentReport(id: $id, format: $format) {
      ${REPORT_RESPONSE_FIELDS}
    }
  }
`;

export const EXPORT_REPORT_BOOK: TypedDocumentNode<
  { exportReportBook: ReportResponse },
  { periodId: string }
> = gql`
  query ExportReportBook($periodId: ID!) {
    exportReportBook(periodId: $periodId) {
      ${REPORT_RESPONSE_FIELDS}
    }
  }
`;

// ── Period mutations ─────────────────────────────────────────────────────

const PERIOD_RESULT = `
  __typename
  ... on ReportingPeriod {
    ...ReportingPeriodFields
  }
  ... on ReportError {
    ...ReportErrorFields
  }
`;

export const OPEN_REPORTING_PERIOD: TypedDocumentNode<
  { openReportingPeriod: ReportingPeriodResult },
  { input: ReportingPeriodInput }
> = gql`
  mutation OpenReportingPeriod($input: ReportingPeriodInput!) {
    openReportingPeriod(input: $input) {
      ${PERIOD_RESULT}
    }
  }
  ${REPORTING_PERIOD_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const UPDATE_REPORTING_PERIOD: TypedDocumentNode<
  { updateReportingPeriod: ReportingPeriodResult },
  { id: string; input: ReportingPeriodInput }
> = gql`
  mutation UpdateReportingPeriod($id: ID!, $input: ReportingPeriodInput!) {
    updateReportingPeriod(id: $id, input: $input) {
      ${PERIOD_RESULT}
    }
  }
  ${REPORTING_PERIOD_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const CLOSE_REPORTING_PERIOD: TypedDocumentNode<
  { closeReportingPeriod: ReportingPeriodResult },
  { id: string }
> = gql`
  mutation CloseReportingPeriod($id: ID!) {
    closeReportingPeriod(id: $id) {
      ${PERIOD_RESULT}
    }
  }
  ${REPORTING_PERIOD_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

// ── Report mutations: drafting (autosave → draft fields only) ────────────

const DRAFT_RESULT = `
  __typename
  ... on DepartmentReport {
    ...DepartmentReportDraftFields
  }
  ... on ReportError {
    ...ReportErrorFields
  }
`;

const FULL_RESULT = `
  __typename
  ... on DepartmentReport {
    ...DepartmentReportFields
  }
  ... on ReportError {
    ...ReportErrorFields
  }
`;

type DraftResult = DepartmentReportResult<DepartmentReportDraft>;
type FullResult = DepartmentReportResult<DepartmentReport>;

export const SAVE_REPORT_TEXT: TypedDocumentNode<
  { saveReportText: DraftResult },
  { id: string; section: string; text: string }
> = gql`
  mutation SaveReportText($id: ID!, $section: String!, $text: String!) {
    saveReportText(id: $id, section: $section, text: $text) {
      ${DRAFT_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_DRAFT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const SAVE_REPORT_ITEMS: TypedDocumentNode<
  { saveReportItems: DraftResult },
  { id: string; kind: ReportItemKind; items: ReportItemInput[] }
> = gql`
  mutation SaveReportItems($id: ID!, $kind: String!, $items: [ReportItemInput!]!) {
    saveReportItems(id: $id, kind: $kind, items: $items) {
      ${DRAFT_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_DRAFT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const SAVE_REPORT_LEADERS: TypedDocumentNode<
  { saveReportLeaders: DraftResult },
  { id: string; leaders: ReportLeaderInput[] }
> = gql`
  mutation SaveReportLeaders($id: ID!, $leaders: [ReportLeaderInput!]!) {
    saveReportLeaders(id: $id, leaders: $leaders) {
      ${DRAFT_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_DRAFT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const SAVE_REPORT_FINANCIAL_NOTES: TypedDocumentNode<
  { saveReportFinancialNotes: DraftResult },
  { id: string } & FinancialNotesValue
> = gql`
  mutation SaveReportFinancialNotes($id: ID!, $note: String!, $lineNotes: [LineNoteInput!]!) {
    saveReportFinancialNotes(id: $id, note: $note, lineNotes: $lineNotes) {
      ${DRAFT_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_DRAFT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

// ── Report mutations: lifecycle (full report back) ───────────────────────

export const START_DEPARTMENT_REPORT: TypedDocumentNode<
  { startDepartmentReport: FullResult },
  { periodId: string; departmentId: string }
> = gql`
  mutation StartDepartmentReport($periodId: ID!, $departmentId: ID!) {
    startDepartmentReport(periodId: $periodId, departmentId: $departmentId) {
      ${FULL_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const CARRY_FORWARD_OBJECTIVES: TypedDocumentNode<
  { carryForwardObjectives: FullResult },
  { id: string; itemIds: string[] }
> = gql`
  mutation CarryForwardObjectives($id: ID!, $itemIds: [ID!]!) {
    carryForwardObjectives(id: $id, itemIds: $itemIds) {
      ${FULL_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const SUBMIT_DEPARTMENT_REPORT: TypedDocumentNode<
  { submitDepartmentReport: FullResult },
  { id: string }
> = gql`
  mutation SubmitDepartmentReport($id: ID!) {
    submitDepartmentReport(id: $id) {
      ${FULL_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const RETURN_DEPARTMENT_REPORT: TypedDocumentNode<
  { returnDepartmentReport: FullResult },
  { id: string; comments: ReportCommentInput[] }
> = gql`
  mutation ReturnDepartmentReport($id: ID!, $comments: [ReportCommentInput!]!) {
    returnDepartmentReport(id: $id, comments: $comments) {
      ${FULL_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const APPROVE_DEPARTMENT_REPORT: TypedDocumentNode<
  { approveDepartmentReport: FullResult },
  { id: string }
> = gql`
  mutation ApproveDepartmentReport($id: ID!) {
    approveDepartmentReport(id: $id) {
      ${FULL_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;

export const REOPEN_DEPARTMENT_REPORT: TypedDocumentNode<
  { reopenDepartmentReport: FullResult },
  { id: string; reason: string }
> = gql`
  mutation ReopenDepartmentReport($id: ID!, $reason: String!) {
    reopenDepartmentReport(id: $id, reason: $reason) {
      ${FULL_RESULT}
    }
  }
  ${DEPARTMENT_REPORT_FIELDS}
  ${REPORT_ERROR_FIELDS}
`;
