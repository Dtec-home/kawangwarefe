/**
 * CampaignShareCard — "Share this campaign" with the shared ShareBar, used on
 * the campaign page (2.9) and after giving on /confirmation (2.11).
 */

"use client";

import { ShareBar } from "@/components/campaigns/shared/share-bar";
import type { PaymentInstructions } from "@/lib/types/fundraising";
import { cn } from "@/lib/utils";
import { campaignShareMessage, campaignShareUrl } from "./share-message";

interface CampaignShareCardProps {
  campaign: {
    slug: string;
    title: string;
    publicUrl: string;
    paymentInstructions: Pick<PaymentInstructions, "paybillNumber" | "accountReference"> | null;
  };
  /** Shown under the heading; defaults to a general invitation. */
  description?: string;
  /** Show the campaign's title (useful away from the campaign page). */
  showTitle?: boolean;
  className?: string;
}

export function CampaignShareCard({ campaign, description, showTitle = false, className }: CampaignShareCardProps) {
  return (
    <section
      data-slot="campaign-share-card"
      aria-labelledby={`share-${campaign.slug}`}
      className={cn("space-y-3 rounded-2xl border bg-card p-5 shadow-sm", className)}
    >
      <div className="space-y-1">
        <h2 id={`share-${campaign.slug}`} className="font-semibold">
          Share this campaign
        </h2>
        {showTitle ? <p className="text-lg font-semibold leading-snug">{campaign.title}</p> : null}
        <p className="text-sm text-muted-foreground">
          {description ?? "Pass the link on to family and friends who would like to help."}
        </p>
      </div>
      <ShareBar
        url={campaignShareUrl(campaign)}
        text={campaignShareMessage(campaign.title, campaign.paymentInstructions)}
        title={campaign.title}
      />
    </section>
  );
}
