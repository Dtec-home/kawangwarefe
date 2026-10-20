/**
 * /campaigns/[slug] — a campaign's public page (lane S2-UI-C, tickets 2.7–2.10):
 * story, totals-only progress, give panel and share bar.
 */

import { Navigation } from "@/components/landing/navigation";
import { CampaignPageView } from "@/components/campaigns/public/campaign-page-view";

interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <CampaignPageView slug={slug} />
        </div>
      </main>
    </div>
  );
}
