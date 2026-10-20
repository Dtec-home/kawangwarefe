/**
 * StatementTab — The campaign's own statement and charts. Owned by lane S4-UI-G.
 * S0 stub rendered by app/(dashboard)/admin/campaigns/[id]/page.tsx.
 */

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export const StatementTab: React.FC<CampaignTabProps> = () => (
  <PlannedFeature title="The campaign's own statement and charts" sprint="Sprint 4" />
);
