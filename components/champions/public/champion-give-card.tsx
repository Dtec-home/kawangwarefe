/**
 * ChampionGiveCard — give through a champion: the decision-4 notice right by
 * the form, the M-Pesa prompt carrying the champion's code, and the Pay Bill
 * account "<CAMPAIGN> <CHAMPION>" (S5-UI-I, ticket 5.7).
 */

"use client";

import { Eye } from "lucide-react";
import { CampaignStkForm } from "@/components/campaigns/give/campaign-stk-form";
import { PaybillInstructions } from "@/components/campaigns/give/paybill-instructions";
import type { PublicChampionPageChampion } from "@/lib/graphql/fundraising/public-champions";
import { championVisibilityNotice, firstName } from "./champion-format";

export function ChampionGiveCard({ champion }: { champion: PublicChampionPageChampion }) {
  const { campaign } = champion;
  const first = firstName(champion.championName);
  return (
    <section
      id="give"
      aria-labelledby="champion-give-heading"
      className="scroll-mt-24 space-y-5 rounded-2xl border bg-card p-5 shadow-md sm:p-6"
    >
      <header className="space-y-1">
        <h2 id="champion-give-heading" className="text-xl font-semibold">
          Give through {first}
        </h2>
        <p className="text-sm text-muted-foreground">
          Your gift goes to {campaign.title} and counts towards {first}&apos;s total.
        </p>
      </header>
      <p
        data-testid="champion-visibility-notice"
        className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm text-foreground"
      >
        <Eye className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{championVisibilityNotice(champion.championName)}</span>
      </p>
      <CampaignStkForm
        slug={campaign.slug}
        categoryId={campaign.categoryId}
        purposeId={campaign.purposeId}
        campaignId={campaign.campaignId}
        championCode={champion.code}
      />
      <PaybillInstructions instructions={champion.paymentInstructions} />
    </section>
  );
}
