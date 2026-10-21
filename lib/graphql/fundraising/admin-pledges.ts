/**
 * Admin pledge register documents (Fundraising S3, lane S3-UI-F).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type {
  FileExportResponse,
  Pledge,
  PledgeInput,
  PledgeResponse,
  PledgeStatus,
  PledgeSummary,
} from "@/lib/types/fundraising";

const PLEDGE_FIELDS = `
  id
  memberId
  memberName
  campaignId
  campaignTitle
  campaignSlug
  categoryId
  categoryName
  amount
  paid
  balance
  dueDate
  status
  source
  createdAt
`;

/** What a register (and its totals) is limited to. */
export interface PledgeScope {
  campaignId: string | null;
  categoryId: string | null;
}

export const GET_PLEDGES = gql`
  query GetPledges($campaignId: ID, $categoryId: ID, $status: PledgeStatus, $search: String) {
    pledges(campaignId: $campaignId, categoryId: $categoryId, status: $status, search: $search) {
      ${PLEDGE_FIELDS}
    }
  }
`;

export interface PledgesData {
  pledges: Pledge[];
}

export interface PledgesVars extends PledgeScope {
  status: PledgeStatus | null;
  search: string | null;
}

export const GET_PLEDGE_SUMMARY = gql`
  query GetPledgeSummary($campaignId: ID, $categoryId: ID) {
    pledgeSummary(campaignId: $campaignId, categoryId: $categoryId) {
      pledged
      paid
      outstanding
      pledgeCount
    }
  }
`;

export interface PledgeSummaryData {
  pledgeSummary: PledgeSummary;
}

export type PledgeSummaryVars = PledgeScope;

const PLEDGE_RESPONSE_FIELDS = `
  success
  message
  pledge {
    ${PLEDGE_FIELDS}
  }
`;

export const RECORD_PLEDGE = gql`
  mutation RecordPledge($phoneNumber: String!, $input: PledgeInput!, $memberName: String) {
    recordPledge(phoneNumber: $phoneNumber, input: $input, memberName: $memberName) {
      ${PLEDGE_RESPONSE_FIELDS}
    }
  }
`;

export interface RecordPledgeData {
  recordPledge: PledgeResponse;
}

export interface RecordPledgeVars {
  phoneNumber: string;
  input: PledgeInput;
  memberName: string | null;
}

export const CANCEL_PLEDGE = gql`
  mutation CancelPledge($id: ID!, $reason: String!) {
    cancelPledge(id: $id, reason: $reason) {
      ${PLEDGE_RESPONSE_FIELDS}
    }
  }
`;

export interface CancelPledgeData {
  cancelPledge: PledgeResponse;
}

export interface CancelPledgeVars {
  id: string;
  reason: string;
}

export type PledgeExportFormat = "excel" | "pdf";

export const EXPORT_PLEDGES = gql`
  mutation ExportPledges($format: String!, $campaignId: ID, $categoryId: ID) {
    exportPledges(format: $format, campaignId: $campaignId, categoryId: $categoryId) {
      success
      message
      fileData
      filename
      contentType
    }
  }
`;

export interface ExportPledgesData {
  exportPledges: FileExportResponse;
}

export interface ExportPledgesVars extends PledgeScope {
  format: PledgeExportFormat;
}

/** Operation names, for `refetchQueries` after a pledge is recorded or cancelled. */
export const PLEDGE_REGISTER_QUERIES = ["GetPledges", "GetPledgeSummary"];
