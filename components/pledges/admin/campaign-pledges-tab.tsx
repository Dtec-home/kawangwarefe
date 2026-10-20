/**
 * CampaignPledgesTab — This campaign's pledges. Owned by lane S3-UI-F.
 * S0 stub rendered by app/(dashboard)/admin/campaigns/[id]/page.tsx.
 */

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export const CampaignPledgesTab: React.FC<CampaignTabProps> = () => (
  <PlannedFeature title="This campaign's pledges" sprint="Sprint 3" />
);
