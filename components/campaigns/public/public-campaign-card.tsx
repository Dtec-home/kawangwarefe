/**
 * PublicCampaignCard — one campaign on the /campaigns grid: cover, title,
 * summary, totals-only progress and days left. The whole card is one link.
 */

import Link from "next/link";
import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import type { PublicCampaignCard as CardData } from "@/lib/graphql/fundraising/public";
import { CampaignCover } from "./campaign-cover";
import { DaysLeft } from "./days-left";

export function PublicCampaignCard({ campaign }: { campaign: CardData }) {
  const href = `/campaigns/${encodeURIComponent(campaign.slug)}`;
  return (
    <article
      data-slot="public-campaign-card"
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-lg"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        <CampaignCover url={campaign.coverImageUrl} className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-snug">
            <Link href={href} className="outline-none after:absolute after:inset-0">
              {campaign.title}
            </Link>
          </h2>
          {campaign.summary ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.summary}</p>
          ) : null}
        </div>
        <CampaignProgress progress={campaign.progress} className="mt-auto" />
        <DaysLeft daysLeft={campaign.daysLeft} />
      </div>
    </article>
  );
}
