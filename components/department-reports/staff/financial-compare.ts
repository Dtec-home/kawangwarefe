/**
 * Books today vs the figures frozen on submit (DR-8, US-15). Money arrives as
 * decimal strings; compare in cents so "100.0" and "100.00" agree.
 */

import type { FinancialStatement } from "@/lib/department-reports/types";

export type CompareKey = "broughtForward" | "moneyIn" | "moneyOut" | "carriedForward";

export interface CompareRow {
  key: CompareKey;
  label: string;
  submitted: string;
  today: string;
  changed: boolean;
  /** today − submitted, as a decimal string with two places. */
  difference: string;
}

const ROWS: ReadonlyArray<{ key: CompareKey; label: string }> = [
  { key: "broughtForward", label: "Balance brought forward" },
  { key: "moneyIn", label: "Money in" },
  { key: "moneyOut", label: "Money out" },
  { key: "carriedForward", label: "Balance carried forward" },
];

export function toCents(amount: string): number {
  const value = Number.parseFloat(amount);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

type Figures = Pick<FinancialStatement, CompareKey>;

export function compareStatements(submitted: Figures, today: Figures): CompareRow[] {
  return ROWS.map(({ key, label }) => {
    const delta = toCents(today[key]) - toCents(submitted[key]);
    return {
      key,
      label,
      submitted: submitted[key],
      today: today[key],
      changed: delta !== 0,
      difference: (delta / 100).toFixed(2),
    };
  });
}

export function statementsDiffer(submitted: Figures, today: Figures): boolean {
  return compareStatements(submitted, today).some((row) => row.changed);
}
