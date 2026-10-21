/**
 * CampaignPledgesTab: the Pledges tab of /admin/campaigns/[id]
 * (Fundraising S3, lane S3-UI-F, ticket 3.12).
 *
 * The admin pledge register, fixed to this campaign: its totals, its pledges,
 * export, "Record a pledge card" and cancel.
 */

"use client";

import type { CampaignTabProps } from "@/components/campaigns/admin/types";

import { PledgeRegister } from "./pledge-register";

export const CampaignPledgesTab: React.FC<CampaignTabProps> = ({ campaignId }) => (
  <PledgeRegister campaignId={campaignId} />
);
