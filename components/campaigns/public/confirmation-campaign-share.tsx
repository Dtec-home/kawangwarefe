/**
 * ConfirmationCampaignShare — after giving to a campaign, invite the giver to
 * share it (Fundraising S0 slot on /confirmation, lane S2-UI-C, ticket 2.11).
 *
 * The campaign give panel (S1-UI-B) sends givers to
 * /confirmation?...&campaign=<slug>. With a slug this shows a "Share this
 * campaign" card; without one, or if the campaign can't be loaded, it renders
 * nothing so the confirmation page is unchanged. The page already sits inside
 * a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { PUBLIC_CAMPAIGN_SHARE, type PublicCampaignShareData } from "@/lib/graphql/fundraising/public";
import { CampaignShareCard } from "./campaign-share-card";

export function ConfirmationCampaignShare() {
  const slug = useSearchParams()?.get("campaign")?.trim() ?? "";
  const { data } = useQuery<PublicCampaignShareData>(PUBLIC_CAMPAIGN_SHARE, {
    variables: { slug },
    skip: !slug,
    // publicCampaign(slug) has no id; keep this small selection out of the shared cache.
    fetchPolicy: "no-cache",
  });

  const campaign = slug ? data?.publicCampaign : null;
  if (!campaign) return null;

  return (
    <CampaignShareCard
      campaign={campaign}
      showTitle
      description="Thank you for giving. Invite others to join you."
    />
  );
}
