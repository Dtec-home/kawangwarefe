/**
 * Values, validation and mapping for "Make a pledge" (S3-UI-E, ticket 3.8).
 */

import type { PledgeInput } from "@/lib/types/fundraising";

export type PledgeTargetKind = "campaign" | "department";

export interface PledgeFormValues {
  kind: PledgeTargetKind;
  campaignId: string;
  categoryId: string;
  amount: string;
  /** YYYY-MM-DD, or "" for none. */
  dueDate: string;
}

export type PledgeFormErrors = Partial<Record<"target" | "amount" | "dueDate", string>>;

export function emptyPledgeForm(kind: PledgeTargetKind = "campaign"): PledgeFormValues {
  return { kind, campaignId: "", categoryId: "", amount: "", dueDate: "" };
}

/** Errors to show; empty when the form can be sent. `today` is YYYY-MM-DD. */
export function validatePledgeForm(values: PledgeFormValues, today: string): PledgeFormErrors {
  const errors: PledgeFormErrors = {};
  if (values.kind === "campaign" && !values.campaignId) errors.target = "Choose a campaign";
  if (values.kind === "department" && !values.categoryId) errors.target = "Choose a department";
  const amount = Number.parseFloat(values.amount);
  if (!Number.isFinite(amount) || amount < 1) errors.amount = "Amount must be at least KES 1";
  if (values.dueDate && values.dueDate < today) errors.dueDate = "The due date cannot be in the past";
  return errors;
}

/** The createPledge input: exactly one of campaign or department. */
export function toPledgeInput(values: PledgeFormValues): PledgeInput {
  return {
    amount: values.amount.trim(),
    ...(values.kind === "campaign" ? { campaignId: values.campaignId } : { categoryId: values.categoryId }),
    dueDate: values.dueDate || null,
  };
}
