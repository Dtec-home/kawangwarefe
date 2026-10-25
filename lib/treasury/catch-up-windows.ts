/**
 * Catch-up window rules (T2.8). Mirrors treasury/services/entry_date_unlocks.py;
 * the backend remains authoritative.
 */

import { nairobiToday } from "./entry-dates";

export const MIN_REASON_LENGTH = 10;
export const MIN_HOURS = 1;
export const MAX_HOURS = 72;
export const DEFAULT_HOURS = 24;

export interface CatchUpWindowErrors {
  date?: string;
  reason?: string;
  hours?: string;
}

export function validateCatchUpWindow(
  values: { date: string; reason: string; hours: string },
  today: string = nairobiToday()
): CatchUpWindowErrors {
  const errors: CatchUpWindowErrors = {};
  if (!values.date) {
    errors.date = "Choose the date to open.";
  } else if (values.date >= today) {
    errors.date = "Choose a past date — today and future dates can't be opened.";
  }
  if (values.reason.trim().length < MIN_REASON_LENGTH) {
    errors.reason = `Give a reason of at least ${MIN_REASON_LENGTH} characters.`;
  }
  const hours = Number(values.hours);
  if (!Number.isInteger(hours) || hours < MIN_HOURS || hours > MAX_HOURS) {
    errors.hours = `Duration must be a whole number of hours between ${MIN_HOURS} and ${MAX_HOURS}.`;
  }
  return errors;
}
