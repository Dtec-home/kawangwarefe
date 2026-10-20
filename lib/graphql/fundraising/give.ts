/**
 * GraphQL documents for giving to a fundraising campaign (lane S1-UI-B).
 *
 * Typed with lib/types/fundraising.ts (frozen contract).
 */

import { gql } from "@apollo/client";
import type { CampaignProgress, PaymentInstructions, PublicCampaign } from "@/lib/types/fundraising";

const PROGRESS_FIELDS = `
  target
  raised
  remaining
  percent
  donorCount
  giftCount
  pledged
`;

/** The public, aggregates-only view the give panel needs. */
export const PUBLIC_CAMPAIGN_FOR_GIVING = gql`
  query PublicCampaignForGiving($slug: String!) {
    publicCampaign(slug: $slug) {
      slug
      title
      summary
      isAcceptingGifts
      categoryId
      purposeId
      campaignId
      paymentInstructions {
        paybillNumber
        accountReference
        text
      }
      progress {
        ${PROGRESS_FIELDS}
      }
    }
  }
`;

export type GivingCampaign = Pick<
  PublicCampaign,
  "slug" | "title" | "summary" | "isAcceptingGifts" | "categoryId" | "purposeId" | "campaignId"
> & {
  paymentInstructions: PaymentInstructions;
  progress: CampaignProgress;
};

export interface PublicCampaignForGivingData {
  publicCampaign: GivingCampaign | null;
}

/** Single-category STK push tagged with the campaign. */
export const INITIATE_CAMPAIGN_CONTRIBUTION = gql`
  mutation InitiateCampaignContribution(
    $phoneNumber: String!
    $amount: String!
    $categoryId: ID!
    $purposeId: ID
    $campaignId: ID
  ) {
    initiateContribution(
      phoneNumber: $phoneNumber
      amount: $amount
      categoryId: $categoryId
      purposeId: $purposeId
      campaignId: $campaignId
    ) {
      success
      message
      checkoutRequestId
      contribution {
        id
      }
    }
  }
`;

export interface InitiateCampaignContributionVars {
  phoneNumber: string;
  amount: string;
  categoryId: string;
  /** Only sent when the campaign targets a purpose. */
  purposeId?: string;
  campaignId: string;
}

export interface InitiateCampaignContributionData {
  initiateContribution: {
    success: boolean;
    message: string;
    checkoutRequestId: string | null;
    contribution: { id: string } | null;
  };
}

/**
 * Campaigns taking gifts that a manual-entry line can be tagged with.
 * `givingCampaigns` is open to recorders as well as staff (titles and
 * departments only), aliased so the data shape stays `campaigns`.
 */
export const ACTIVE_CAMPAIGNS_FOR_LINES = gql`
  query ActiveCampaignsForLines {
    campaigns: givingCampaigns {
      id
      title
      categoryId
      categoryName
    }
  }
`;

export interface LineCampaignOption {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
}

export interface ActiveCampaignsForLinesData {
  campaigns: LineCampaignOption[];
}
