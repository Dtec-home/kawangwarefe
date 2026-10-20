/**
 * Admin campaign documents (Fundraising S1, lane S1-UI-A).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type { Campaign, CampaignStatus } from "@/lib/types/fundraising";

const PROGRESS_FIELDS = `
  progress {
    target
    raised
    remaining
    percent
    donorCount
    giftCount
    pledged
  }
`;

/** What one row of the campaign list needs. */
export type CampaignListItem = Pick<
  Campaign,
  "id" | "title" | "paybillCode" | "categoryId" | "categoryName" | "status" | "endDate" | "progress"
>;

export const GET_CAMPAIGNS = gql`
  query GetCampaigns($status: CampaignStatus, $search: String) {
    campaigns(status: $status, search: $search) {
      id
      title
      paybillCode
      categoryId
      categoryName
      status
      endDate
      ${PROGRESS_FIELDS}
    }
  }
`;

export interface CampaignsData {
  campaigns: CampaignListItem[];
}

export interface CampaignsVars {
  status: CampaignStatus | null;
  search: string | null;
}
