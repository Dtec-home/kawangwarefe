/**
 * WhatsApp contributor list documents (Fundraising S2, lane S2-UI-D, ticket 2.13; decision 7).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type { MutationResult, WhatsAppContributorList } from "@/lib/types/fundraising";

export const GET_WHATSAPP_CONTRIBUTOR_LIST = gql`
  query GetWhatsappContributorList($campaignId: ID!) {
    whatsappContributorList(campaignId: $campaignId) {
      text
      contributorCount
      totalAmount
      asAt
      shareUrl
    }
  }
`;

export interface WhatsappContributorListData {
  whatsappContributorList: WhatsAppContributorList;
}

export interface WhatsappContributorListVars {
  campaignId: string;
}

export const RECORD_WHATSAPP_SHARE = gql`
  mutation RecordWhatsappShare($campaignId: ID!) {
    recordWhatsappShare(campaignId: $campaignId) {
      success
      message
    }
  }
`;

export interface RecordWhatsappShareData {
  recordWhatsappShare: MutationResult;
}

export interface RecordWhatsappShareVars {
  campaignId: string;
}
