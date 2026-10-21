/**
 * ChampionShareCard — share the champion's own link, with their Pay Bill
 * account in the message (S5-UI-I, ticket 5.7).
 */

"use client";

import { ShareBar } from "@/components/campaigns/shared/share-bar";
import { campaignShareMessage } from "@/components/campaigns/public/share-message";
import type { PublicChampionPageChampion } from "@/lib/graphql/fundraising/public-champions";
import { championShareUrl, firstName } from "./champion-format";

export function ChampionShareCard({ champion }: { champion: PublicChampionPageChampion }) {
  const first = firstName(champion.championName);
  return (
    <section aria-labelledby="champion-share-heading" className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-1">
        <h2 id="champion-share-heading" className="font-semibold">
          Share {first}&apos;s page
        </h2>
        <p className="text-sm text-muted-foreground">
          Gifts through this link count towards {first}&apos;s total.
        </p>
      </div>
      <ShareBar
        url={championShareUrl({ slug: champion.campaign.slug, code: champion.code, publicUrl: champion.publicUrl })}
        text={campaignShareMessage(champion.campaign.title, champion.paymentInstructions)}
        title={`${champion.championName} for ${champion.campaign.title}`}
      />
    </section>
  );
}
