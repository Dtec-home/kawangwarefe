/**
 * PublicPledgeSlot — pledging on the public campaign page (Fundraising S3 slot,
 * hosted by components/campaigns/public/campaign-page-view.tsx).
 *
 * Owned by lane S3-UI-E: when `allowPledges`, show "Pledged X · Received Y"
 * and the guest pledge form (name, phone, amount, due date, then the SMS code
 * step: startGuestPledge / confirmGuestPledge). Renders nothing until then.
 */

"use client";

import type { PublicCampaign } from "@/lib/types/fundraising";

export interface PublicPledgeSlotProps {
  campaign: Pick<PublicCampaign, "slug" | "title" | "allowPledges" | "isAcceptingGifts" | "progress">;
}

export const PublicPledgeSlot: React.FC<PublicPledgeSlotProps> = () => null;
