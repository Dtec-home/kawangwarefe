/**
 * Pure helpers for fund transfers (FT-2) and moving a gift (RA-2).
 *
 * Client validation mirrors the backend (treasury/services/fund_transfers.py
 * and contributions/payment_reallocation.py); the server stays authoritative.
 * Money is handled in integer cents so 0.10 + 0.20 adds up.
 */

import { formatKes } from "@/lib/receipts/format";
import type { FundRef, FundTransferError, FundTransferStatus, PurposeRef } from "@/lib/fund-transfers/types";

export const TRANSFER_STATUS_FILTERS: { value: FundTransferStatus; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export const TRANSFER_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TRANSFER_STATUS_FILTERS.map((s) => [s.value, s.label]),
);

const TRANSFER_MESSAGES: Record<string, string> = {
  forbidden: "You are not allowed to do this with this transfer. You can't decide your own request.",
  not_found: "That transfer, department or purpose no longer exists. Refresh and try again.",
  same_fund: "Choose a different department or purpose to move the money to.",
  invalid_amount: "Enter an amount greater than 0 with at most two decimals.",
  reason_required: "Give a reason.",
  purpose_mismatch: "That purpose does not belong to the chosen department.",
  insufficient_funds: "The source fund does not hold that much on the transfer date.",
  invalid_transition: "This transfer has already been decided or cancelled.",
};

export function transferErrorMessage(code: string, fallback?: string): string {
  return TRANSFER_MESSAGES[code] ?? fallback ?? "Something went wrong. Nothing changed.";
}

const REALLOCATION_MESSAGES: Record<string, string> = {
  total_mismatch: "The new lines must add up to exactly the payment total.",
  invalid_target: "Check each line: the department or purpose is not valid.",
  not_found: "This payment can't be found. It may have already been moved — refresh the list.",
  forbidden: "Only a treasurer or an admin can move a gift.",
  reason_required: "Say why the gift is being moved.",
};

export function reallocationErrorMessage(code: string | null | undefined, fallback: string): string {
  return (code && REALLOCATION_MESSAGES[code]) || fallback || "Something went wrong. Nothing changed.";
}

export function isFundTransferError(value: unknown): value is FundTransferError {
  return !!value && typeof value === "object" && (value as { __typename?: string }).__typename === "FundTransferError";
}

/** "1,250.5" → 125050; null for anything that isn't a non-negative amount with ≤ 2 decimals. */
export function amountToCents(raw: string): number | null {
  const cleaned = (raw ?? "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatCents(cents: number): string {
  return formatKes(cents / 100);
}

export function fundLabel(department: Pick<FundRef, "name">, purpose: Pick<PurposeRef, "name"> | null | undefined): string {
  return purpose ? `${department.name} / ${purpose.name}` : department.name;
}

export interface TransferDraft {
  fromDepartmentId: string;
  fromPurposeId: string;
  toDepartmentId: string;
  toPurposeId: string;
  amount: string;
  transferDate: string;
  reason: string;
}

/** First problem with the draft, or null. `available` null = still loading. */
export function validateTransfer(draft: TransferDraft, available: string | null): string | null {
  if (!draft.fromDepartmentId) return "Choose the department to move money from.";
  if (!draft.toDepartmentId) return "Choose the department to move money to.";
  if (draft.fromDepartmentId === draft.toDepartmentId && (draft.fromPurposeId || "") === (draft.toPurposeId || "")) {
    return TRANSFER_MESSAGES.same_fund;
  }
  const cents = amountToCents(draft.amount);
  if (cents === null || cents <= 0) return TRANSFER_MESSAGES.invalid_amount;
  if (available !== null) {
    const availableCents = Math.round(Number.parseFloat(available) * 100);
    if (Number.isFinite(availableCents) && cents > availableCents) {
      return `The source only holds ${formatKes(available)} on that date.`;
    }
  }
  if (!draft.transferDate) return "Choose the transfer date.";
  if (!draft.reason.trim()) return TRANSFER_MESSAGES.reason_required;
  return null;
}

export interface TargetDraft {
  departmentId: string;
  purposeId: string;
  amount: string;
}

export function sumTargets(rows: Pick<TargetDraft, "amount">[]): number {
  return rows.reduce((sum, row) => sum + (amountToCents(row.amount) ?? 0), 0);
}

/** First problem with the target lines against the payment total (cents), or null. */
export function validateMoveGift(rows: TargetDraft[], paymentCents: number): string | null {
  if (rows.length === 0) return "Add at least one line.";
  if (rows.some((r) => !r.departmentId)) return "Choose a department on every line.";
  if (rows.some((r) => {
    const cents = amountToCents(r.amount);
    return cents === null || cents <= 0;
  })) {
    return "Every line needs an amount greater than 0.";
  }
  const total = sumTargets(rows);
  if (total !== paymentCents) {
    return `The lines add up to ${formatCents(total)} but the payment is ${formatCents(paymentCents)}.`;
  }
  return null;
}
