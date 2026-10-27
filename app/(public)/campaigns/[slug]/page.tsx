/**
 * /campaigns/[slug] — a campaign's public page (lane S2-UI-C, tickets 2.7–2.10):
 * story, totals-only progress, give panel and share bar.
 */

import type { Metadata } from "next";
import { CampaignPageView } from "@/components/campaigns/public/campaign-page-view";
import { campaignMetadata, fetchCampaignMeta } from "@/components/campaigns/public/server/campaign-meta";

interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

/** Title, description, canonical, Open Graph and X card; falls back if the API is down. */
export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params;
  return campaignMetadata(slug, await fetchCampaignMeta(slug));
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <CampaignPageView slug={slug} />
        </div>
      </main>
    </div>
  );
}
