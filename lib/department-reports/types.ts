/**
 * Yearly department reports (DEPARTMENT_REPORTS, DR-6): TypeScript types that
 * mirror the GraphQL SDL in DEPARTMENT_REPORTS/02_CONTRACTS.md § GraphQL.
 *
 * Money is a string over GraphQL (a Decimal on the backend), never a number.
 * Dates are ISO strings: `Date` → "2026-07-31", `DateTime` → ISO 8601.
 */

/** The eight template sections, in template order (registry keys). */
export type SectionKey =
  | "introduction"
  | "leaders"
  | "objectives"
  | "achievements"
  | "challenges"
  | "recommendations"
  | "financial"
  | "conclusion";

export type SectionKind = "text" | "list" | "leaders" | "financial";

/** A stored report's workflow status. */
export type ReportStatus = "draft" | "submitted" | "returned" | "approved";

/** A tracker row's status: a report's status, or `not_started` when none exists. */
export type TrackerStatus = ReportStatus | "not_started";

export type ReportItemKind = "objective" | "achievement" | "challenge" | "recommendation";

export type FinancialDirection = "in" | "out";

export type ReportingPeriodStatus = "open" | "closed";

export type ReportExportFormat = "pdf" | "docx";

/** Codes a mutation may return in `ReportError.code` (02_CONTRACTS.md § Errors). */
export type ReportErrorCode =
  | "forbidden"
  | "period_already_open"
  | "invalid_dates"
  | "locked"
  | "too_long"
  | "too_many_items"
  | "too_few_items"
  | "incomplete"
  | "comment_required"
  | "invalid_transition"
  | "not_found"
  | "period_closed"
  | "invalid_section"
  | "invalid_link"
  | "invalid_item"
  | "reason_required";

// ── Object types ─────────────────────────────────────────────────────────

export interface ReportSectionSpec {
  key: SectionKey;
  number: number;
  title: string;
  kind: SectionKind;
  required: boolean;
  /** 0 = no lower bound. */
  minItems: number;
  /** 0 = no upper bound. */
  maxItems: number;
  /** 0 = no limit. */
  maxChars: number;
}

export interface ReportingPeriod {
  __typename?: "ReportingPeriod";
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: ReportingPeriodStatus;
}

export interface FinancialLine {
  direction: FinancialDirection;
  label: string;
  amount: string;
  note: string;
}

export interface FinancialStatement {
  broughtForward: string;
  moneyIn: string;
  moneyOut: string;
  carriedForward: string;
  asOf: string;
  lines: FinancialLine[];
  /** True when read from the snapshot frozen on submit. */
  frozen: boolean;
  pendingRequisitionCount: number;
  pendingRequisitionTotal: string;
}

export interface ReportItem {
  id: string;
  kind: ReportItemKind;
  order: number;
  text: string;
  fulfilsId: string | null;
  carriedFromId: string | null;
}

export interface ReportLeader {
  name: string;
  roleTitle: string;
  phone: string;
  memberId: string | null;
}

export interface ReportComment {
  sectionKey: SectionKey;
  body: string;
  author: string;
  createdAt: string;
  resolved: boolean;
}

export interface MissingSection {
  key: SectionKey;
  reason: string;
}

/** The fields of `CategoryType` (ContributionCategoryType) the reports UI reads. */
export interface ReportDepartment {
  id: string;
  name: string;
  code: string;
}

/** The fields every autosave mutation returns (no money: cheap to recompute). */
export interface DepartmentReportDraft {
  __typename?: "DepartmentReport";
  id: string;
  status: ReportStatus;
  overdue: boolean;
  version: number;
  introduction: string;
  conclusion: string;
  financialNote: string;
  leaders: ReportLeader[];
  items: ReportItem[];
  missing: MissingSection[];
  /** Sections complete, 0..8. */
  progress: number;
  canEdit: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canReopen: boolean;
}

export interface DepartmentReport extends DepartmentReportDraft {
  period: ReportingPeriod;
  department: ReportDepartment;
  comments: ReportComment[];
  /** The snapshot when frozen, live figures otherwise. */
  financial: FinancialStatement;
  /** Treasurer/staff only, when frozen (US-15); null otherwise. */
  liveFinancial: FinancialStatement | null;
  carryForwardCandidates: ReportItem[];
}

/** The slice of a report a tracker row or "My reports" card shows. */
export interface TrackerReport {
  id: string;
  status: ReportStatus;
  overdue: boolean;
  progress: number;
  version: number;
  canEdit: boolean;
  canReview: boolean;
}

export interface TrackerRow {
  department: ReportDepartment;
  period: ReportingPeriod;
  report: TrackerReport | null;
  status: TrackerStatus;
  overdue: boolean;
  progress: number;
  leaderNames: string[];
}

export interface ReportError {
  __typename: "ReportError";
  code: ReportErrorCode | (string & {});
  message: string;
  /** Empty unless `code` is "incomplete". */
  missing: MissingSection[];
}

/** `union DepartmentReportResult = DepartmentReport | ReportError` */
export type DepartmentReportResult<R extends DepartmentReportDraft = DepartmentReport> =
  | (R & { __typename: "DepartmentReport" })
  | ReportError;

/** `union ReportingPeriodResult = ReportingPeriod | ReportError` */
export type ReportingPeriodResult = (ReportingPeriod & { __typename: "ReportingPeriod" }) | ReportError;

/** The existing base64 export type (`api_schema/report_mutations.py`). */
export interface ReportResponse {
  success: boolean;
  message: string;
  fileData: string | null;
  filename: string | null;
  contentType: string | null;
}

// ── Inputs ───────────────────────────────────────────────────────────────

export interface ReportingPeriodInput {
  label: string;
  startDate: string;
  endDate: string;
  dueDate: string;
}

export interface ReportItemInput {
  id?: string | null;
  text: string;
  fulfilsId?: string | null;
}

export interface ReportLeaderInput {
  name: string;
  roleTitle: string;
  phone?: string | null;
  memberId?: string | null;
}

export interface ReportCommentInput {
  sectionKey: SectionKey;
  body: string;
}

/** Lines are keyed by direction + label. */
export interface LineNoteInput {
  direction: FinancialDirection;
  label: string;
  note: string;
}

/** What the Financial step saves: the narrative plus a note per line. */
export interface FinancialNotesValue {
  note: string;
  lineNotes: LineNoteInput[];
}

/** The value `saveSection(key, value)` takes for each section. */
export interface SectionValueMap {
  introduction: string;
  conclusion: string;
  leaders: ReportLeaderInput[];
  objectives: ReportItemInput[];
  achievements: ReportItemInput[];
  challenges: ReportItemInput[];
  recommendations: ReportItemInput[];
  financial: FinancialNotesValue;
}

export type SectionValue = SectionValueMap[SectionKey];
