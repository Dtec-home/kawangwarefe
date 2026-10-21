/**
 * GraphQL documents for the champion public pages (lane S5-UI-I).
 *
 * `publicChampion(slug, code)` and `campaignLeaderboard(slug, limit)` are open
 * to anyone and carry totals only (never donor names). Neither result has an
 * id, so the views read them with `fetchPolicy: "no-cache"`.
 * Typed with lib/types/fundraising.ts (frozen contract).
 */

import { gql } from "@apollo/client";
import type { LeaderboardEntry, PublicCampaign, PublicChampion } from "@/lib/types/fundraising";

/** One champion's page: who, their totals, the campaign and how to give. */
export const PUBLIC_CHAMPION_PAGE = gql`
  query PublicChampionPage($slug: String!, $code: String!) {
    publicChampion(slug: $slug, code: $code) {
      championName
      code
      raised
      donorCount
      personalTarget
      publicUrl
      paymentInstructions {
        paybillNumber
        accountReference
        text
      }
      campaign {
        slug
        title
        summary
        coverImageUrl
        daysLeft
        isAcceptingGifts
        categoryId
        purposeId
        campaignId
        publicUrl
        progress {
          target
          raised
          remaining
          percent
          donorCount
          giftCount
          pledged
        }
      }
    }
  }
`;

export type PublicChampionPageCampaign = Pick<
  PublicCampaign,
  | "slug"
  | "title"
  | "summary"
  | "coverImageUrl"
  | "daysLeft"
  | "isAcceptingGifts"
  | "categoryId"
  | "purposeId"
  | "campaignId"
  | "publicUrl"
  | "progress"
>;

export type PublicChampionPageChampion = Omit<PublicChampion, "campaign"> & {
  campaign: PublicChampionPageCampaign;
};

export interface PublicChampionPageData {
  publicChampion: PublicChampionPageChampion | null;
}

export interface PublicChampionPageVars {
  slug: string;
  code: string;
}

/** Top champions of a campaign: rank, name and totals. */
export const CAMPAIGN_LEADERBOARD = gql`
  query CampaignLeaderboard($slug: String!, $limit: Int!) {
    campaignLeaderboard(slug: $slug, limit: $limit) {
      rank
      championName
      code
      raised
      donorCount
    }
  }
`;

export interface CampaignLeaderboardData {
  campaignLeaderboard: LeaderboardEntry[];
}

export interface CampaignLeaderboardVars {
  slug: string;
  limit: number;
}
