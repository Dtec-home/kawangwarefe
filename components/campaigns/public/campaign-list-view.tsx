/**
 * CampaignListView — the /campaigns grid of active public campaigns
 * (lane S2-UI-C, ticket 2.7). Totals only; never donor names.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { HandHeart, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLIC_CAMPAIGNS, type PublicCampaignsData } from "@/lib/graphql/fundraising/public";
import { PublicCampaignCard } from "./public-campaign-card";

const GRID = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function CampaignListView() {
  const { data, loading, error, refetch } = useQuery<PublicCampaignsData>(PUBLIC_CAMPAIGNS);

  if (loading && !data) {
    return (
      <div className={GRID} data-testid="campaigns-loading">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-96 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <Empty
        icon={RefreshCw}
        title="Campaigns could not be loaded"
        description="Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const campaigns = data?.publicCampaigns ?? [];
  if (campaigns.length === 0) {
    return (
      <Empty
        icon={HandHeart}
        title="There are no campaigns to give to right now"
        description="You can still give to any church department."
        action={
          <Link href="/contribute" className={buttonVariants()}>
            Give to the church
          </Link>
        }
      />
    );
  }

  return (
    <div className={GRID}>
      {campaigns.map((campaign) => (
        <PublicCampaignCard key={campaign.slug} campaign={campaign} />
      ))}
    </div>
  );
}
