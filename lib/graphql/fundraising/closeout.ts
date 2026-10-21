/**
 * Expense-campaign and close-out documents (Fundraising S4, lane S4-UI-H).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type { Campaign } from "@/lib/types/fundraising";

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
