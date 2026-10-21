/**
 * LeaderboardSlot — the champion leaderboard on the public campaign page
 * (Fundraising S5 slot, hosted by components/campaigns/public/campaign-page-view.tsx).
 *
 * Owned by lane S5-UI-I: when `allowChampions`, show campaignLeaderboard
 * (champion names and totals only). Renders nothing until then.
 */

"use client";

import type { PublicCampaign } from "@/lib/types/fundraising";

export interface LeaderboardSlotProps {
  campaign: Pick<PublicCampaign, "slug" | "allowChampions">;
}

export const LeaderboardSlot: React.FC<LeaderboardSlotProps> = () => null;
