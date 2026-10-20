/**
 * CampaignOverview — Campaign overview: progress, details and submit/approve/pause/resume actions. Owned by lane S1-UI-A.
 * S0 stub rendered by app/(dashboard)/admin/campaigns/[id]/page.tsx.
 */

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export const CampaignOverview: React.FC<CampaignTabProps> = () => (
  <PlannedFeature title="Campaign overview" sprint="Sprint 1" />
);
