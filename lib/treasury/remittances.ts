/**
 * Remittance and local-fund form helpers (T4.1, T4.2; spec 03 §5).
 */

import type { RemittanceMethod, RemittanceSummary } from "@/lib/graphql/treasury-queries";

export interface RemittanceMethodOption {
  value: RemittanceMethod;
  label: string;
  summaryKey: keyof Pick<RemittanceSummary, "cash" | "bankSlip" | "cheque" | "moneyOrder">;
}

/** Print order, matching the backend's `Remittance.Method`. */
export const REMITTANCE_METHODS: RemittanceMethodOption[] = [
  { value: "cash", label: "Cash", summaryKey: "cash" },
  { value: "bank_slip", label: "Bank slip", summaryKey: "bankSlip" },
  { value: "cheque", label: "Cheque", summaryKey: "cheque" },
  { value: "money_order", label: "Money order", summaryKey: "moneyOrder" },
];

export function remittanceMethodLabel(method: string): string {
  return REMITTANCE_METHODS.find((m) => m.value === method)?.label ?? method;
}

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const SIGNED_AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/;

/** Error for a remittance amount (must be > 0, at most 2 decimals), or null. */
export function remittanceAmountError(amount: string): string | null {
  const value = amount.trim();
  if (!value) return "Enter an amount";
  if (!AMOUNT_PATTERN.test(value)) return "Enter a valid amount with at most 2 decimal places";
  if (Number.parseFloat(value) <= 0) return "The amount must be greater than 0";
  return null;
}

/** Error for an opening balance amount (may be negative), or null. */
export function openingAmountError(amount: string): string | null {
  const value = amount.trim();
  if (!value) return "Enter an amount";
  if (!SIGNED_AMOUNT_PATTERN.test(value)) return "Enter a valid amount with at most 2 decimal places";
  return null;
}
