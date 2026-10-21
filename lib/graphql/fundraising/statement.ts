/**
 * Campaign statement documents (Fundraising S4, lane S4-UI-G).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type { CampaignStatement, FileExportResponse } from "@/lib/types/fundraising";

/** The period a statement covers; null on either side means open-ended. */
export interface StatementPeriod {
  dateFrom: string | null;
  dateTo: string | null;
}

export const GET_CAMPAIGN_STATEMENT = gql`
  query GetCampaignStatement($campaignId: ID!, $dateFrom: Date, $dateTo: Date) {
    campaignStatement(campaignId: $campaignId, dateFrom: $dateFrom, dateTo: $dateTo) {
      campaignId
      dateFrom
      dateTo
      rows {
        on
        description
        channel
        moneyIn
        moneyOut
        balance
      }
      totalIn
      totalOut
      balance
    }
  }
`;

export interface CampaignStatementData {
  campaignStatement: CampaignStatement;
}

export interface CampaignStatementVars extends StatementPeriod {
  campaignId: string;
}

export type StatementExportFormat = "excel" | "pdf";

export const EXPORT_CAMPAIGN_STATEMENT = gql`
  mutation ExportCampaignStatement($campaignId: ID!, $format: String!, $dateFrom: Date, $dateTo: Date) {
    exportCampaignStatement(campaignId: $campaignId, format: $format, dateFrom: $dateFrom, dateTo: $dateTo) {
      success
      message
      fileData
      filename
      contentType
    }
  }
`;

export interface ExportCampaignStatementData {
  exportCampaignStatement: FileExportResponse;
}

export interface ExportCampaignStatementVars extends StatementPeriod {
  campaignId: string;
  format: StatementExportFormat;
}
