/**
 * Rules for one allocation row when resolving a Pay Bill payment (F5).
 *
 * A department that splits automatically (``hasAutoSplit``, e.g. Combined
 * Offering -> CKC/LCB) needs no purpose: the backend applies the configured
 * split (``create_contributions_honouring_split``), so the treasurer is never
 * asked to divide the amount by hand.
 */

export const AUTO_SPLIT = "__auto_split__";
/** Radix Select cannot hold an empty value; this stands for "no purpose". */
export const NO_PURPOSE = "__none__";

export interface CategoryRules {
  id: string;
  routingMode?: string;
  hasAutoSplit?: boolean;
}

export interface AllocationLike {
  categoryId: string;
  purposeId: string;
  amount: string;
}

export function purposeChoice(category?: CategoryRules) {
  const mode = category?.routingMode;
  const show = mode === "REQUIRES_PURPOSE" || mode === "OPTIONAL_DETAILS";
  const autoSplit = Boolean(show && category?.hasAutoSplit);
  return { show, required: show && mode === "REQUIRES_PURPOSE" && !autoSplit, autoSplit };
}

export function allocationIsValid(row: AllocationLike, category?: CategoryRules): boolean {
  if (!row.categoryId || !category) return false;
  if (purposeChoice(category).required && !purposeIdForApi(row.purposeId)) return false;
  const amount = parseFloat(row.amount);
  return Number.isFinite(amount) && amount > 0;
}

export function purposeIdForApi(purposeId: string): string | undefined {
  return purposeId && purposeId !== AUTO_SPLIT && purposeId !== NO_PURPOSE ? purposeId : undefined;
}
