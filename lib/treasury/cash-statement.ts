/**
 * Cash Statement date helpers (spec 03 §3, §6). Dates are Nairobi-local
 * ISO strings (YYYY-MM-DD).
 */

import { nairobiToday } from "./entry-dates";

/** The backend refuses ranges longer than this (inclusive day count). */
export const MAX_STATEMENT_DAYS = 366;

/** The most recent Saturday in Nairobi, today included when today is a Saturday. */
export function mostRecentSaturday(now: Date = new Date()): string {
  const today = new Date(`${nairobiToday(now)}T00:00:00Z`);
  const daysSinceSaturday = (today.getUTCDay() + 1) % 7; // Sat=6 → 0, Sun=0 → 1, Fri=5 → 6
  today.setUTCDate(today.getUTCDate() - daysSinceSaturday);
  return today.toISOString().slice(0, 10);
}

/** Days from dateFrom to dateTo, both included (1 for a single date). */
export function inclusiveDayCount(dateFrom: string, dateTo: string): number {
  const from = Date.parse(`${dateFrom}T00:00:00Z`);
  const to = Date.parse(`${dateTo}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000) + 1;
}

/** A client-side error message for a statement range, or null when valid. */
export function statementRangeError(dateFrom: string, dateTo: string): string | null {
  if (!dateFrom || !dateTo) return "Choose both a start and an end date";
  if (dateTo < dateFrom) return "The end date must not be before the start date";
  if (inclusiveDayCount(dateFrom, dateTo) > MAX_STATEMENT_DAYS) {
    return `A Cash Statement can cover at most ${MAX_STATEMENT_DAYS} days`;
  }
  return null;
}
