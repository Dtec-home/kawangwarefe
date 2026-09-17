/**
 * ContributionLinesForm — department / purpose / member-identifier / amount
 * lines for a physically recorded gift (T2.5).
 *
 * Shared by the admin manual-entry page and the recorder workspace so both
 * apply the same department rules (purpose required, member identifier
 * tracked) and the same validation before calling
 * `createManualMultiContribution`.
 */

"use client";

import { Label } from "@/components/ui/label";
import {
  MultiCategorySelector,
  type CategoryAmount,
} from "@/components/forms/multi-category-selector";
import { formatKes } from "@/lib/receipts/format";

export type { CategoryAmount };

/** A blank line (no department, no amount). */
export const emptyContributionLine = (): CategoryAmount => ({ categoryId: "", amount: "", purposeId: "" });

/** Shape of `ManualCategoryAmountInput` in the GraphQL schema. */
export interface ManualCategoryAmountInput {
  categoryId: string;
  amount: string;
  purposeId: string | null;
  memberIdentifier: string | null;
}

export type ContributionLinesValidation =
  | { ok: true; lines: CategoryAmount[] }
  | { ok: false; error: string };

/**
 * Drops fully blank lines and checks the rest: each needs a department and an
 * amount of at least KES 1. The backend re-validates everything.
 */
export function validateContributionLines(lines: CategoryAmount[]): ContributionLinesValidation {
  const cleaned = lines.filter((c) => c.categoryId || c.amount);
  if (cleaned.length === 0) {
    return { ok: false, error: "Add at least one department and amount" };
  }
  for (const line of cleaned) {
    if (!line.categoryId) {
      return { ok: false, error: "Please select a department for every line" };
    }
    if (!line.amount || parseFloat(line.amount) < 1) {
      return { ok: false, error: "Each amount must be at least KES 1.00" };
    }
  }
  return { ok: true, lines: cleaned };
}

/** Mutation input for validated lines. */
export function toManualCategoryInputs(lines: CategoryAmount[]): ManualCategoryAmountInput[] {
  return lines.map((c) => ({
    categoryId: c.categoryId,
    amount: c.amount,
    purposeId: c.purposeId || null,
    memberIdentifier: c.memberIdentifier || null,
  }));
}

/** Sum of the valid amounts on the lines. */
export function contributionLinesTotal(lines: CategoryAmount[]): number {
  return lines.reduce((sum, line) => {
    const value = Number.parseFloat(line.amount);
    return Number.isFinite(value) && value > 0 ? sum + value : sum;
  }, 0);
}

interface ContributionLinesFormProps {
  lines: CategoryAmount[];
  onChange: (lines: CategoryAmount[]) => void;
  /** Giver's phone, used to prefill a tracked member identifier */
  phoneNumber?: string;
  label?: string;
  /** Show a running total under the lines */
  showTotal?: boolean;
}

export function ContributionLinesForm({
  lines,
  onChange,
  phoneNumber,
  label = "Departments *",
  showTotal = false,
}: ContributionLinesFormProps) {
  const total = contributionLinesTotal(lines);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <MultiCategorySelector contributions={lines} onChange={onChange} phoneNumber={phoneNumber} />
      {showTotal && (
        <div
          className="flex items-center justify-between rounded-lg bg-muted px-4 py-3"
          data-testid="lines-total"
          aria-live="polite"
        >
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatKes(total)}</span>
        </div>
      )}
    </div>
  );
}
