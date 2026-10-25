/**
 * PublicPledgeSlot — pledging on the public campaign page (Fundraising S3 slot,
 * hosted by components/campaigns/public/campaign-page-view.tsx).
 *
 * Owned by lane S3-UI-E: when the campaign takes pledges and gifts, a
 * "Pledge to give later" card with "Pledged X · Received Y" (totals only)
 * above the guest pledge form (name, phone, amount, due date, then the SMS
 * code step: startGuestPledge / confirmGuestPledge). Renders nothing otherwise.
 */

"use client";

import { CalendarHeart } from "lucide-react";

import type { PublicCampaign } from "@/lib/types/fundraising";

import { GuestPledgeFlow } from "./guest-pledge-flow";
import { PledgeTotals } from "./pledge-totals";

export interface PublicPledgeSlotProps {
  campaign: Pick<PublicCampaign, "slug" | "title" | "allowPledges" | "isAcceptingGifts" | "progress">;
}

export const PublicPledgeSlot: React.FC<PublicPledgeSlotProps> = ({ campaign }) => {
  if (!campaign.allowPledges || !campaign.isAcceptingGifts) return null;
  return (
    <section
      id="pledge"
      aria-labelledby="pledge-heading"
      className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <header className="space-y-1">
        <h2 id="pledge-heading" className="flex items-center gap-2 text-lg font-semibold">
          <CalendarHeart className="size-5 text-primary" aria-hidden="true" />
          Pledge to give later
        </h2>
        <p className="text-sm text-muted-foreground">
          Can&apos;t give today? Promise an amount and give it when you can.
        </p>
      </header>
      <PledgeTotals progress={campaign.progress} />
      <GuestPledgeFlow slug={campaign.slug} title={campaign.title} />
    </section>
  );
};
