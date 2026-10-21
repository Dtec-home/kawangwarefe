/**
 * GraphQL documents for the public campaign pages (lane S2-UI-C).
 *
 * `publicCampaigns` / `publicCampaign(slug)` are open to anyone and return
 * aggregates only (never donor names). Typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";
import type { PublicCampaign } from "@/lib/types/fundraising";

const PROGRESS = `
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

/** Every active public campaign, for the /campaigns grid. */
export const PUBLIC_CAMPAIGNS = gql`
  query PublicCampaigns {
    publicCampaigns {
      slug
      title
      summary
      coverImageUrl
      endDate
      daysLeft
      isAcceptingGifts
      ${PROGRESS}
    }
  }
`;

export type PublicCampaignCard = Pick<
  PublicCampaign,
  "slug" | "title" | "summary" | "coverImageUrl" | "endDate" | "daysLeft" | "isAcceptingGifts" | "progress"
>;

export interface PublicCampaignsData {
  publicCampaigns: PublicCampaignCard[];
}

/** One campaign's public page: story, gallery, progress and updates. */
export const PUBLIC_CAMPAIGN_PAGE = gql`
  query PublicCampaignPage($slug: String!) {
    publicCampaign(slug: $slug) {
      slug
      title
      summary
      story
      coverImageUrl
      gallery {
        kind
        url
      }
      targetAmount
      endDate
      daysLeft
      isAcceptingGifts
      allowPledges
      allowChampions
      publicUrl
      paymentInstructions {
        paybillNumber
        accountReference
        text
      }
      ${PROGRESS}
      updates {
        id
        title
        body
        imageUrl
        publishedAt
      }
    }
  }
`;

export type PublicCampaignPageUpdate = Pick<
  PublicCampaign["updates"][number],
  "id" | "title" | "body" | "imageUrl" | "publishedAt"
>;

export type PublicCampaignPageCampaign = Pick<
  PublicCampaign,
  | "slug"
  | "title"
  | "summary"
  | "story"
  | "coverImageUrl"
  | "gallery"
  | "targetAmount"
  | "endDate"
  | "daysLeft"
  | "isAcceptingGifts"
  | "allowPledges"
  | "allowChampions"
  | "publicUrl"
  | "paymentInstructions"
  | "progress"
> & { updates: PublicCampaignPageUpdate[] };

export interface PublicCampaignPageData {
  publicCampaign: PublicCampaignPageCampaign | null;
}

/** What the "Share this campaign" card after giving needs. */
export const PUBLIC_CAMPAIGN_SHARE = gql`
  query PublicCampaignShare($slug: String!) {
    publicCampaign(slug: $slug) {
      slug
      title
      publicUrl
      paymentInstructions {
        paybillNumber
        accountReference
        text
      }
    }
  }
`;

export type PublicCampaignShareCampaign = Pick<
  PublicCampaign,
  "slug" | "title" | "publicUrl" | "paymentInstructions"
>;

export interface PublicCampaignShareData {
  publicCampaign: PublicCampaignShareCampaign | null;
}
