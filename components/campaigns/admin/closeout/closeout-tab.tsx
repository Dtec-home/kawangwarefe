/**
 * CloseoutTab — Close the campaign and view the final statement. Owned by lane S4-UI-H.
 * S0 stub rendered by app/(dashboard)/admin/campaigns/[id]/page.tsx.
 */

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export const CloseoutTab: React.FC<CampaignTabProps> = () => (
  <PlannedFeature title="Close the campaign and view the final statement" sprint="Sprint 4" />
);
