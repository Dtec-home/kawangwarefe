/**
 * CampaignGiveSection — the give panel on a campaign's public page
 * (lane S2-UI-C, ticket 2.8): S1-UI-B's CampaignGivePanel plus the donor
 * notice required by decision 7 (the WhatsApp contributor list).
 */

"use client";

import { Users } from "lucide-react";
import { CampaignGivePanel } from "@/components/campaigns/give/campaign-give-panel";

/** Decision 7: donors are told, but given no opt-out. */
export const WHATSAPP_LIST_NOTICE =
  "Contributors to this campaign are listed by name and amount in the church WhatsApp group.";

export function CampaignGiveSection({ slug }: { slug: string }) {
  return (
    <section id="give" aria-label="Give to this campaign" className="scroll-mt-24 space-y-3">
      <CampaignGivePanel slug={slug} className="shadow-md" />
      <p className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
        <Users className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{WHATSAPP_LIST_NOTICE}</span>
      </p>
    </section>
  );
}
