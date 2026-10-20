/**
 * CampaignGivePanel — give to one fundraising campaign: title, progress, an
 * M-Pesa prompt form and the Pay Bill account (S1-UI-B, ticket 1.12).
 *
 * Reads the public, aggregates-only `publicCampaign(slug)`, so it is safe on
 * public pages. Exported for reuse by the public campaign page (S2-UI-C) and
 * the "Pay balance" flow (S3-UI-E).
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { HeartHandshake, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import {
  PUBLIC_CAMPAIGN_FOR_GIVING,
  type PublicCampaignForGivingData,
} from "@/lib/graphql/fundraising/give";
import { CampaignStkForm } from "./campaign-stk-form";
import { PaybillInstructions } from "./paybill-instructions";

export interface CampaignGivePanelProps {
  slug: string;
  className?: string;
}

function BackToGiving() {
  return (
    <Link href="/contribute" className={buttonVariants({ variant: "outline" })}>
      Give to a department instead
    </Link>
  );
}

export function CampaignGivePanel({ slug, className }: CampaignGivePanelProps) {
  const { data, loading, error } = useQuery<PublicCampaignForGivingData>(PUBLIC_CAMPAIGN_FOR_GIVING, {
    variables: { slug },
  });

  if (loading && !data) {
    return <Skeleton data-testid="campaign-give-loading" className="h-96 w-full rounded-xl" />;
  }

  const campaign = data?.publicCampaign;
  if (error || !campaign) {
    return (
      <Card className={className}>
        <Empty
          icon={SearchX}
          title="We couldn't find that campaign"
          description="The link may be mistyped, or the campaign has ended."
          action={<BackToGiving />}
        />
      </Card>
    );
  }

  if (!campaign.isAcceptingGifts) {
    return (
      <Card className={className}>
        <Empty
          icon={HeartHandshake}
          title={campaign.title}
          description="This campaign is not accepting gifts right now."
          action={<BackToGiving />}
        />
      </Card>
    );
  }

  return (
    <Card className={className} data-slot="campaign-give-panel">
      <CardHeader className="space-y-2 border-b pb-4">
        <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{campaign.title}</h2>
        {campaign.summary ? <CardDescription>{campaign.summary}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <CampaignProgress progress={campaign.progress} />
        <CampaignStkForm slug={campaign.slug} categoryId={campaign.categoryId} campaignId={campaign.campaignId} />
        <PaybillInstructions instructions={campaign.paymentInstructions} />
      </CardContent>
    </Card>
  );
}
