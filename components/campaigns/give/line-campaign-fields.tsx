/**
 * LineCampaignFields — lets a recorder tag a manual-entry line with a
 * fundraising campaign (and champion code) of that line's department
 * (Fundraising S0 slot in ContributionLinesForm).
 *
 * Owned by lane S1-UI-B. Set `campaignId` / `championCode` on the lines and
 * call `onChange`; `toManualCategoryInputs` sends them to the backend.
 * Renders nothing until then.
 */

"use client";

import type { CategoryAmount } from "@/components/forms/multi-category-selector";

export interface LineCampaignFieldsProps {
  lines: CategoryAmount[];
  onChange: (lines: CategoryAmount[]) => void;
}

export const LineCampaignFields: React.FC<LineCampaignFieldsProps> = () => null;
