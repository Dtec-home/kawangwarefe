/**
 * Pure display rules for a member's pledge (Fundraising S3, lane S3-UI-E):
 * what it is for, its status pill, whether it is overdue, and where
 * "Pay balance" goes.
 */

import type { StatusVariant } from "@/components/ui/status-badge";
import { nairobiToday } from "@/lib/treasury/entry-dates";
import type { Pledge, PledgeStatus } from "@/lib/types/fundraising";

type PledgeLike = Pick<
  Pledge,
  "campaignTitle" | "campaignSlug" | "categoryName" | "amount" | "paid" | "balance" | "dueDate" | "status"
>;

const STATUS: Record<PledgeStatus, { label: string; variant: StatusVariant }> = {
  PENDING_OTP: { label: "Awaiting confirmation", variant: "warning" },
  OPEN: { label: "Open", variant: "info" },
  FULFILLED: { label: "Fulfilled", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function pledgeStatusLabel(status: PledgeStatus): string {
  return STATUS[status]?.label ?? status;
}

export function pledgeStatusVariant(status: PledgeStatus): StatusVariant {
  return STATUS[status]?.variant ?? "neutral";
}

/** The campaign title, else the department, else a neutral fallback. */
export function pledgeTargetName(pledge: Pick<Pledge, "campaignTitle" | "categoryName">): string {
  return pledge.campaignTitle || pledge.categoryName || "General pledge";
}

export function pledgeTargetKind(pledge: Pick<Pledge, "campaignTitle">): "Campaign" | "Department" {
  return pledge.campaignTitle ? "Campaign" : "Department";
}

function amountOf(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** A pledge the member still owes money on. */
export function isPledgeActive(pledge: Pick<Pledge, "status" | "balance">): boolean {
  return (pledge.status === "OPEN" || pledge.status === "OVERDUE") && amountOf(pledge.balance) > 0;
}

/** Overdue by status, or past its due date with a balance left. */
export function isPledgeOverdue(pledge: PledgeLike, today: string = nairobiToday()): boolean {
  if (pledge.status === "OVERDUE") return true;
  return isPledgeActive(pledge) && !!pledge.dueDate && pledge.dueDate < today;
}

export const canPayBalance = isPledgeActive;
export const canCancelPledge = isPledgeActive;

/** The S1 campaign give page for campaign pledges, else the general give page. */
export function payBalanceHref(pledge: Pick<Pledge, "campaignSlug">): string {
  return pledge.campaignSlug ? `/contribute?campaign=${encodeURIComponent(pledge.campaignSlug)}` : "/contribute";
}

/** Paid as a percentage of the pledge, 0–100. */
export function paidPercent(pledge: Pick<Pledge, "amount" | "paid">): number {
  const amount = amountOf(pledge.amount);
  if (amount <= 0) return 0;
  return Math.min(Math.max((amountOf(pledge.paid) / amount) * 100, 0), 100);
}

/** Totals across the pledges that are not cancelled. */
export function pledgeTotals(pledges: PledgeLike[]): { pledged: number; paid: number; balance: number } {
  return pledges
    .filter((p) => p.status !== "CANCELLED" && p.status !== "PENDING_OTP")
    .reduce(
      (sum, p) => ({
        pledged: sum.pledged + amountOf(p.amount),
        paid: sum.paid + amountOf(p.paid),
        balance: sum.balance + amountOf(p.balance),
      }),
      { pledged: 0, paid: 0, balance: 0 }
    );
}
