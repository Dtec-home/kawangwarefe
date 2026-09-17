/**
 * Collection session helpers (T5.1 / T5.3, PRD CS-1..CS-3).
 *
 * Money is compared in whole cents so "1500" and "1500.00" agree and float
 * rounding never produces a phantom variance.
 */

import { nairobiToday } from "./entry-dates";

/** Kenyan notes and coins offered in the close & count sheet. */
export const DENOMINATIONS = ["1000", "500", "200", "100", "50", "40", "20", "10", "5", "1"] as const;

export const DEFAULT_SESSION_NAME = "Divine Service";
export const MIN_VARIANCE_REASON_LENGTH = 10;
export const MIN_UNLOCK_REASON_LENGTH = 10;

/** Denomination → typed count (as entered; blank = not counted). */
export type BreakdownCounts = Record<string, string>;

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** "1,500.50" / "1500.5" → 150050 cents; null when not a non-negative amount. */
export function toCents(value: string | null | undefined): number | null {
  const cleaned = (value ?? "").replace(/,/g, "").trim();
  if (!AMOUNT_PATTERN.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Signed decimal string from the API ("-200.00") → cents. */
export function signedToCents(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const cents = toCents(negative ? trimmed.slice(1) : trimmed);
  if (cents === null) return null;
  return negative ? -cents : cents;
}

/** 150050 → "1500.50" */
export function centsToAmount(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Rows with a whole, positive count, in denomination order. */
export function breakdownEntries(counts: BreakdownCounts): { denomination: string; count: number }[] {
  return DENOMINATIONS.flatMap((denomination) => {
    const raw = (counts[denomination] ?? "").trim();
    if (!/^\d+$/.test(raw)) return [];
    const count = Number(raw);
    return count > 0 ? [{ denomination, count }] : [];
  });
}

/** Σ denomination × count, in cents. */
export function breakdownTotalCents(counts: BreakdownCounts): number {
  return breakdownEntries(counts).reduce((sum, { denomination, count }) => sum + Number(denomination) * 100 * count, 0);
}

export interface CloseSessionInput {
  countedCash: string;
  counts: BreakdownCounts;
  varianceReason: string;
  /** The session's recorded total (API decimal string) */
  recordedTotal: string;
}

export interface CloseSessionErrors {
  countedCash?: string;
  breakdown?: string;
  varianceReason?: string;
}

export interface CloseSessionCheck {
  errors: CloseSessionErrors;
  /** counted − recorded in cents; null while the counted cash is invalid */
  varianceCents: number | null;
  breakdownCents: number;
  hasBreakdown: boolean;
}

/** Mirrors the backend rules for closing a session. */
export function checkCloseSession({ countedCash, counts, varianceReason, recordedTotal }: CloseSessionInput): CloseSessionCheck {
  const errors: CloseSessionErrors = {};
  const counted = toCents(countedCash);
  const recorded = toCents(recordedTotal) ?? 0;
  const hasBreakdown = breakdownEntries(counts).length > 0;
  const breakdownCents = breakdownTotalCents(counts);

  const invalidCount = DENOMINATIONS.some((d) => {
    const raw = (counts[d] ?? "").trim();
    return raw !== "" && !/^\d+$/.test(raw);
  });

  if (!countedCash.trim()) errors.countedCash = "Enter the cash you counted";
  else if (counted === null) errors.countedCash = "Enter a valid amount (up to 2 decimal places)";

  if (invalidCount) {
    errors.breakdown = "Counts must be whole numbers";
  } else if (hasBreakdown && counted !== null && breakdownCents !== counted) {
    errors.breakdown = `The breakdown adds up to KES ${formatCents(breakdownCents)}, not KES ${formatCents(counted)}`;
  }

  const varianceCents = counted === null ? null : counted - recorded;
  if (varianceCents !== null && varianceCents !== 0 && varianceReason.trim().length < MIN_VARIANCE_REASON_LENGTH) {
    errors.varianceReason = `Explain the difference (at least ${MIN_VARIANCE_REASON_LENGTH} characters)`;
  }

  return { errors, varianceCents, breakdownCents, hasBreakdown };
}

/** 150050 → "1,500.50" */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** A session from a previous day that is still open (forgotten close). */
export function isStaleSession(session: { date: string; status: string }, now: Date = new Date()): boolean {
  return session.status === "open" && session.date < nairobiToday(now);
}

/** The church week (Sunday → Saturday) containing today, in Nairobi. */
export function thisChurchWeek(now: Date = new Date()): { dateFrom: string; dateTo: string } {
  const today = new Date(`${nairobiToday(now)}T00:00:00Z`);
  const from = new Date(today);
  from.setUTCDate(today.getUTCDate() - today.getUTCDay());
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

/** Shift an ISO date range by whole weeks. */
export function shiftWeeks(range: { dateFrom: string; dateTo: string }, weeks: number) {
  const shift = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + weeks * 7);
    return d.toISOString().slice(0, 10);
  };
  return { dateFrom: shift(range.dateFrom), dateTo: shift(range.dateTo) };
}
