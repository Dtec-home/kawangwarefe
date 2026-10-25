/**
 * Expense-campaign and close-out documents (Fundraising S4, lane S4-UI-H).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type { Campaign, CampaignStatement, MutationResult } from "@/lib/types/fundraising";

/**
 * Every campaign an expense could be charged to, for the expense dialogs
 * (ticket 4.8). The staff `campaigns` query includes paused and closed ones;
 * the select narrows them to the expense's fund.
 */
export const EXPENSE_CAMPAIGN_OPTIONS = gql`
  query ExpenseCampaignOptions {
    campaigns {
      id
      title
      status
      categoryId
      paybillCode
    }
  }
`;

export type ExpenseCampaignOption = Pick<Campaign, "id" | "title" | "status" | "categoryId" | "paybillCode">;

export interface ExpenseCampaignOptionsData {
  campaigns: ExpenseCampaignOption[];
}

/** What the Close out tab needs to know about the campaign (ticket 4.9). */
const CLOSEOUT_CAMPAIGN_FIELDS = `
  id
  title
  status
  categoryId
  categoryName
  paybillCode
  closedByName
  closedAt
`;

export type CloseoutCampaign = Pick<
  Campaign,
  "id" | "title" | "status" | "categoryId" | "categoryName" | "paybillCode" | "closedByName" | "closedAt"
>;

export const CLOSEOUT_CAMPAIGN = gql`
  query CloseoutCampaign($id: ID!) {
    campaign(id: $id) {
      ${CLOSEOUT_CAMPAIGN_FIELDS}
    }
  }
`;

export interface CloseoutCampaignData {
  campaign: CloseoutCampaign | null;
}

export interface CloseoutCampaignVars {
  id: string;
}

/**
 * Close the campaign (decision 6: any money left over stays in the
 * department; nothing is moved). The returned campaign updates the cached
 * status everywhere on the page.
 */
export const CLOSE_CAMPAIGN = gql`
  mutation CloseCampaign($id: ID!) {
    closeCampaign(id: $id) {
      success
      message
      campaign {
        ${CLOSEOUT_CAMPAIGN_FIELDS}
      }
    }
  }
`;

export interface CloseCampaignData {
  closeCampaign: MutationResult & { campaign: CloseoutCampaign | null };
}

export interface CloseCampaignVars {
  id: string;
}

/** Totals only: the compact final statement shown once a campaign is closed. */
export const CAMPAIGN_FINAL_STATEMENT = gql`
  query CampaignFinalStatement($campaignId: ID!) {
    campaignStatement(campaignId: $campaignId) {
      campaignId
      totalIn
      totalOut
      balance
    }
  }
`;

export type FinalStatementTotals = Pick<CampaignStatement, "campaignId" | "totalIn" | "totalOut" | "balance">;

export interface CampaignFinalStatementData {
  campaignStatement: FinalStatementTotals;
}

export interface CampaignFinalStatementVars {
  campaignId: string;
}
