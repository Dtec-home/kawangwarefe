/**
 * UpdatesTab — Campaign updates: post, timeline, optional SMS to donors. Owned by lane S2-UI-D.
 * S0 stub rendered by app/(dashboard)/admin/campaigns/[id]/page.tsx.
 */

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export const UpdatesTab: React.FC<CampaignTabProps> = () => (
  <PlannedFeature title="Campaign updates" sprint="Sprint 2" />
);
