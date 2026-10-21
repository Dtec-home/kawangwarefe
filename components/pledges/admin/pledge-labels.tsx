/**
 * Pledge status pill, source labels and row helpers for the admin register
 * (Fundraising S3, lane S3-UI-F).
 */

import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { Pledge, PledgeStatus } from "@/lib/types/fundraising";

export const PLEDGE_STATUS_LABELS: Record<PledgeStatus, string> = {
  OPEN: "Open",
  OVERDUE: "Overdue",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  PENDING_OTP: "Awaiting code",
};

const PLEDGE_STATUS_VARIANTS: Record<PledgeStatus, StatusVariant> = {
  OPEN: "info",
  OVERDUE: "warning",
  FULFILLED: "success",
  CANCELLED: "neutral",
  PENDING_OTP: "neutral",
};

export const PLEDGE_SOURCE_LABELS: Record<string, string> = {
  web: "Online",
  public_page: "Public page",
  admin: "Pledge card",
  ussd: "USSD",
  mobile: "Mobile app",
};

export function pledgeStatusLabel(status: PledgeStatus): string {
  return PLEDGE_STATUS_LABELS[status] ?? status;
}

export function pledgeSourceLabel(source: string): string {
  return PLEDGE_SOURCE_LABELS[source.toLowerCase()] ?? source;
}

/** The campaign the pledge is for, else its department. */
export function pledgeTarget(pledge: Pick<Pledge, "campaignTitle" | "categoryName">): string {
  return pledge.campaignTitle || pledge.categoryName || "—";
}

/** Only a pledge that is still owed (or awaiting its code) may be cancelled. */
export function isCancellable(status: PledgeStatus): boolean {
  return status === "OPEN" || status === "OVERDUE" || status === "PENDING_OTP";
}

export function PledgeStatusBadge({ status }: { status: PledgeStatus }) {
  return (
    <StatusBadge variant={PLEDGE_STATUS_VARIANTS[status] ?? "neutral"}>{pledgeStatusLabel(status)}</StatusBadge>
  );
}
