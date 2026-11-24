/**
 * Reporting period form rules (DR-8, US-1). Mirrors the backend's
 * `PeriodService` checks (`start < end <= due`, label ≤ 20 characters) so the
 * admin sees the problem before the request is sent. The server stays the
 * authority: its `invalid_dates` error is still mapped in `report-errors.ts`.
 */

import type { ReportingPeriod, ReportingPeriodInput } from "@/lib/department-reports/types";

export type PeriodFormValues = ReportingPeriodInput;
export type PeriodFormErrors = Partial<Record<keyof PeriodFormValues, string>>;

/** `ReportingPeriod.label` max_length. */
export const PERIOD_LABEL_MAX = 20;

export const EMPTY_PERIOD_FORM: PeriodFormValues = { label: "", startDate: "", endDate: "", dueDate: "" };

export function periodFormValues(period: ReportingPeriod | null | undefined): PeriodFormValues {
  if (!period) return { ...EMPTY_PERIOD_FORM };
  return {
    label: period.label,
    startDate: period.startDate,
    endDate: period.endDate,
    dueDate: period.dueDate,
  };
}

/** ISO `YYYY-MM-DD` strings compare correctly as text. */
export function validatePeriodForm(values: PeriodFormValues): PeriodFormErrors {
  const errors: PeriodFormErrors = {};
  const label = values.label.trim();
  if (!label) errors.label = "Give the period a label, e.g. 2025-2026";
  else if (label.length > PERIOD_LABEL_MAX) errors.label = `Keep the label under ${PERIOD_LABEL_MAX + 1} characters`;

  if (!values.startDate) errors.startDate = "Choose the start date";
  if (!values.endDate) errors.endDate = "Choose the end date";
  if (!values.dueDate) errors.dueDate = "Choose the due date";

  if (values.startDate && values.endDate && !(values.startDate < values.endDate)) {
    errors.endDate = "The end date must be after the start date";
  }
  if (values.endDate && values.dueDate && values.dueDate < values.endDate) {
    errors.dueDate = "Reports can't be due before the period ends";
  }
  return errors;
}

export function hasPeriodErrors(errors: PeriodFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The input the mutation takes (label trimmed). */
export function periodInput(values: PeriodFormValues): ReportingPeriodInput {
  return { ...values, label: values.label.trim() };
}

/** "1 Jul 2025" for an ISO date (read as a calendar date, no time zone shift). */
export function formatPeriodDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
