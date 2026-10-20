/**
 * Campaign status pill and labels (Fundraising S1, lane S1-UI-A).
 */

import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import type { CampaignStatus } from "@/lib/types/fundraising";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Awaiting approval",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

const CAMPAIGN_STATUS_VARIANTS: Record<CampaignStatus, StatusVariant> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  ACTIVE: "success",
  PAUSED: "info",
  CLOSED: "neutral",
};

export function campaignStatusLabel(status: CampaignStatus): string {
  return CAMPAIGN_STATUS_LABELS[status] ?? status;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <StatusBadge variant={CAMPAIGN_STATUS_VARIANTS[status] ?? "neutral"}>
      {campaignStatusLabel(status)}
    </StatusBadge>
  );
}
