/**
 * Champion documents (Fundraising S5, lane S5-UI-J).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 *
 * Member side (ticket 5.9): `myChampionships` and `joinAsChampion` are
 * self-service; `championDashboard` returns the champion's own donors with
 * names and amounts (decision 4) and null for anyone else's page.
 * Staff side (ticket 5.10): `champions`, `inviteChampion`, `approveChampion`
 * and `deactivateChampion`.
 */

import { gql } from "@apollo/client";

import type {
  Campaign,
  Champion,
  ChampionDashboard,
  ChampionResponse,
  PublicCampaign,
} from "@/lib/types/fundraising";

const CHAMPION_FIELDS = `
  id
  campaignId
  campaignTitle
  campaignSlug
  memberName
  code
  personalTarget
  status
  showOnLeaderboard
  raised
  donorCount
  publicUrl
  paymentInstructions {
    paybillNumber
    accountReference
    text
  }
`;

const CHAMPION_RESPONSE_FIELDS = `
  success
  message
  champion {
    ${CHAMPION_FIELDS}
  }
`;

// --- Member side (5.9) ------------------------------------------------------

export const MY_CHAMPIONSHIPS = gql`
  query MyChampionships {
    myChampionships {
      ${CHAMPION_FIELDS}
    }
  }
`;

export interface MyChampionshipsData {
  myChampionships: Champion[];
}

export const CHAMPION_DASHBOARD = gql`
  query ChampionDashboard($championId: ID!) {
    championDashboard(championId: $championId) {
      champion {
        ${CHAMPION_FIELDS}
      }
      donors {
        rank
        name
        amount
        giftCount
        lastGivenAt
      }
    }
  }
`;

export interface ChampionDashboardData {
  championDashboard: ChampionDashboard | null;
}

export interface ChampionDashboardVars {
  championId: string;
}

/** Public campaigns a member may ask to champion (filtered to allowChampions). */
export const CHAMPION_JOIN_CAMPAIGNS = gql`
  query ChampionJoinCampaigns {
    publicCampaigns {
      campaignId
      slug
      title
      allowChampions
      isAcceptingGifts
      paymentInstructions {
        paybillNumber
        accountReference
        text
      }
    }
  }
`;

export type ChampionJoinCampaign = Pick<
  PublicCampaign,
  "campaignId" | "slug" | "title" | "allowChampions" | "isAcceptingGifts" | "paymentInstructions"
>;

export interface ChampionJoinCampaignsData {
  publicCampaigns: ChampionJoinCampaign[];
}

export const JOIN_AS_CHAMPION = gql`
  mutation JoinAsChampion($campaignId: ID!, $code: String!, $personalTarget: String) {
    joinAsChampion(campaignId: $campaignId, code: $code, personalTarget: $personalTarget) {
      ${CHAMPION_RESPONSE_FIELDS}
    }
  }
`;

export interface JoinAsChampionVars {
  campaignId: string;
  code: string;
  personalTarget: string | null;
}

export interface JoinAsChampionData {
  joinAsChampion: ChampionResponse;
}

// --- Staff side (5.10) ------------------------------------------------------

/** The Champions tab: whether the campaign takes champions, and its champions. */
export const CAMPAIGN_CHAMPIONS = gql`
  query CampaignChampions($campaignId: ID!) {
    campaign(id: $campaignId) {
      id
      title
      status
      paybillCode
      allowChampions
    }
    champions(campaignId: $campaignId) {
      ${CHAMPION_FIELDS}
    }
  }
`;

export type ChampionsTabCampaign = Pick<Campaign, "id" | "title" | "status" | "paybillCode" | "allowChampions">;

export interface CampaignChampionsData {
  campaign: ChampionsTabCampaign | null;
  champions: Champion[];
}

export interface CampaignChampionsVars {
  campaignId: string;
}

export const INVITE_CHAMPION = gql`
  mutation InviteChampion($campaignId: ID!, $phoneNumber: String!, $code: String!, $personalTarget: String) {
    inviteChampion(campaignId: $campaignId, phoneNumber: $phoneNumber, code: $code, personalTarget: $personalTarget) {
      ${CHAMPION_RESPONSE_FIELDS}
    }
  }
`;

export interface InviteChampionVars {
  campaignId: string;
  /** 2547XXXXXXXX */
  phoneNumber: string;
  code: string;
  personalTarget: string | null;
}

export interface InviteChampionData {
  inviteChampion: ChampionResponse;
}

export const APPROVE_CHAMPION = gql`
  mutation ApproveChampion($id: ID!) {
    approveChampion(id: $id) {
      ${CHAMPION_RESPONSE_FIELDS}
    }
  }
`;

export const DEACTIVATE_CHAMPION = gql`
  mutation DeactivateChampion($id: ID!) {
    deactivateChampion(id: $id) {
      ${CHAMPION_RESPONSE_FIELDS}
    }
  }
`;

export interface ChampionIdVars {
  id: string;
}

export interface ApproveChampionData {
  approveChampion: ChampionResponse;
}

export interface DeactivateChampionData {
  deactivateChampion: ChampionResponse;
}
