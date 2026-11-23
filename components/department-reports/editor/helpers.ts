/**
 * Pure helpers for the leader's report screens (DEPARTMENT_REPORTS, DR-7):
 * due-date countdown, friendly error messages, and the local row shapes the
 * editor keeps while a section is being written.
 */

import { nairobiToday } from "@/lib/treasury/entry-dates";
import type {
  FinancialStatement,
  MissingSection,
  ReportItem,
  ReportItemInput,
  ReportLeader,
  ReportLeaderInput,
  ReportingPeriod,
} from "@/lib/department-reports/types";

// ── Due date ─────────────────────────────────────────────────────────────

export type DueTone = "ok" | "soon" | "overdue";

export interface DueCountdown {
  label: string;
  tone: DueTone;
}

const DAY_MS = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / DAY_MS);
}

/** "Due in 12 days" / "Due tomorrow" / "Due today" / "3 days overdue" (Nairobi dates). */
export function dueCountdown(dueDate: string, today: string = nairobiToday()): DueCountdown {
  const days = daysBetween(today, dueDate);
  if (days > 1) return { label: `Due in ${days} days`, tone: days <= 14 ? "soon" : "ok" };
  if (days === 1) return { label: "Due tomorrow", tone: "soon" };
  if (days === 0) return { label: "Due today", tone: "soon" };
  const late = -days;
  return { label: `${late} ${late === 1 ? "day" : "days"} overdue`, tone: "overdue" };
}

// ── Errors ───────────────────────────────────────────────────────────────

const FRIENDLY_ERRORS: Record<string, string> = {
  forbidden: "You're not allowed to change this report.",
  not_found: "This report could not be found.",
  locked: "This report has been handed in, so it can't be changed any more.",
  period_closed: "This reporting period is closed.",
  too_long: "Some text is longer than the template allows. Shorten it and try again.",
  too_many_items: "That list has more entries than the template allows.",
  too_few_items: "That list needs more entries.",
  incomplete: "Some sections still need to be filled in before you can submit.",
  invalid_transition: "The report can't be submitted right now. Reload the page and try again.",
  invalid_section: "That section isn't part of the report template.",
  invalid_link: "Pick an objective from this report.",
  invalid_item: "That objective can't be carried forward.",
};

/** A sentence a leader can act on, for a `ReportError` (02_CONTRACTS.md § Errors). */
export function reportErrorMessage(error: { code: string; message?: string | null }): string {
  return FRIENDLY_ERRORS[error.code] ?? (error.message || "Something went wrong. Please try again.");
}

const MISSING_REASONS: Record<string, string> = {
  required: "Not filled in yet",
  too_long: "Too long",
  too_many_items: "Too many entries",
  too_few_items: "Needs more entries",
};

export function missingReasonLabel(missing: Pick<MissingSection, "reason">): string {
  return MISSING_REASONS[missing.reason] ?? "Needs attention";
}

// ── Dates ────────────────────────────────────────────────────────────────

/** "31 Jul 2027" for an ISO date. */
export function formatDueDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "23 Nov 2026, 14:05" (Nairobi) for an ISO datetime. */
export function formatAsOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** The period that ended before `current` started (latest start date first). */
export function previousPeriod(
  periods: readonly ReportingPeriod[],
  current: Pick<ReportingPeriod, "id" | "startDate">,
): ReportingPeriod | null {
  const earlier = periods
    .filter((p) => p.id !== current.id && p.startDate < current.startDate)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return earlier[0] ?? null;
}

// ── Local rows (stable keys while editing) ───────────────────────────────

/** A list item as the editor holds it: a stable React key plus the saved fields. */
export interface ItemRow {
  key: string;
  id: string | null;
  text: string;
  fulfilsId: string | null;
}

export interface LeaderRow {
  key: string;
  name: string;
  roleTitle: string;
  phone: string;
  memberId: string | null;
}

let rowCounter = 0;

/** A fresh key for a row the user just added. */
export function newRowKey(prefix = "new"): string {
  rowCounter += 1;
  return `${prefix}-${rowCounter}`;
}

export function itemRowsFrom(items: readonly ReportItem[], kind: ReportItem["kind"]): ItemRow[] {
  return items
    .filter((item) => item.kind === kind)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ key: `item-${item.id}`, id: item.id, text: item.text, fulfilsId: item.fulfilsId }));
}

export function leaderRowsFrom(leaders: readonly ReportLeader[]): LeaderRow[] {
  return leaders.map((leader, index) => ({
    key: `leader-${index}`,
    name: leader.name,
    roleTitle: leader.roleTitle,
    phone: leader.phone,
    memberId: leader.memberId,
  }));
}

export function toItemInputs(rows: readonly ItemRow[]): ReportItemInput[] {
  return rows.map(({ id, text, fulfilsId }) => ({ id: id ?? null, text, fulfilsId: fulfilsId ?? null }));
}

export function toLeaderInputs(rows: readonly LeaderRow[]): ReportLeaderInput[] {
  return rows.map(({ name, roleTitle, phone, memberId }) => ({ name, roleTitle, phone, memberId: memberId ?? null }));
}

/**
 * Give rows the server ids they were saved under. The server drops blank
 * rows and keeps the order of the rest, so the n-th non-blank row matches
 * the n-th saved item. Rows that already have an id keep it; an id already
 * held by another row is never handed out twice.
 */
export function adoptItemIds(rows: readonly ItemRow[], saved: readonly ReportItem[]): ItemRow[] {
  const ordered = saved.slice().sort((a, b) => a.order - b.order);
  const held = new Set(rows.map((row) => row.id).filter(Boolean));
  let next = 0;
  let changed = false;
  const out = rows.map((row) => {
    if (!row.text.trim()) return row;
    const match = ordered[next];
    next += 1;
    if (row.id || !match || held.has(match.id)) return row;
    held.add(match.id);
    changed = true;
    return { ...row, id: match.id };
  });
  return changed ? out : (rows as ItemRow[]);
}

/** Move the row at `index` by `delta` (−1 up, +1 down); unchanged at the ends. */
export function moveRow<T>(rows: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= rows.length || target < 0 || target >= rows.length) return rows.slice();
  const out = rows.slice();
  [out[index], out[target]] = [out[target], out[index]];
  return out;
}

// ── Financial notes ──────────────────────────────────────────────────────

/** Server limit for one line's note (`LINE_NOTE_MAX_CHARS` in drafting.py). */
export const LINE_NOTE_MAX_CHARS = 300;

export interface FinancialDraft {
  note: string;
  /** `${direction}:${label}` → note. */
  lineNotes: Record<string, string>;
}

export const lineKey = (line: { direction: string; label: string }) => `${line.direction}:${line.label}`;

export function financialDraftFrom(financialNote: string, statement: FinancialStatement | null | undefined): FinancialDraft {
  const lineNotes: Record<string, string> = {};
  for (const line of statement?.lines ?? []) lineNotes[lineKey(line)] = line.note;
  return { note: financialNote, lineNotes };
}
