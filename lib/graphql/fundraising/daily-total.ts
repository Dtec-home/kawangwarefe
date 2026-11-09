/** WhatsApp daily totals (ADR-0015 D5): the share card's query and mutations. */

import { gql } from "@apollo/client";

import type { MutationResult } from "@/lib/types/fundraising";

export interface GroupPost {
  status: string;
  day: string | null;
  sentAt: string | null;
  reason: string;
}

export interface DailyTotal {
  day: string;
  text: string;
  shareUrl: string;
  amountToday: string;
  giversToday: number;
  giftsToday: number;
  lateRecordedToday: string;
  raised: string;
  hasGroup: boolean;
  lastAutoPost: GroupPost | null;
}

export const CAMPAIGN_DAILY_TOTAL = gql`
  query CampaignDailyTotal($campaignId: ID!, $date: Date) {
    campaignDailyTotal(campaignId: $campaignId, date: $date) {
      day
      text
      shareUrl
      amountToday
      giversToday
      giftsToday
      lateRecordedToday
      raised
      hasGroup
      lastAutoPost {
        status
        day
        sentAt
        reason
      }
    }
  }
`;

export interface CampaignDailyTotalData {
  campaignDailyTotal: DailyTotal;
}

export interface CampaignDailyTotalVars {
  campaignId: string;
  date?: string | null;
}

export const POST_DAILY_TOTAL_NOW = gql`
  mutation PostDailyTotalNow($campaignId: ID!, $date: Date) {
    postDailyTotalNow(campaignId: $campaignId, date: $date) {
      success
      message
    }
  }
`;

export const RECORD_DAILY_TOTAL_SHARE = gql`
  mutation RecordDailyTotalShare($campaignId: ID!) {
    recordWhatsappShare(campaignId: $campaignId, kind: "DAILY_TOTAL") {
      success
      message
    }
  }
`;

export interface PostDailyTotalNowData {
  postDailyTotalNow: MutationResult;
}

export interface RecordDailyTotalShareData {
  recordWhatsappShare: MutationResult;
}
