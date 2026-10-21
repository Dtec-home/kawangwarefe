/**
 * CloseoutTab — the Close out tab of /admin/campaigns/[id] (Fundraising S4,
 * lane S4-UI-H, ticket 4.9). Rendered by components/campaigns/admin/campaign-tabs.ts.
 *
 * Active and paused campaigns can be closed after a confirmation; a closed
 * campaign shows when it closed and its final statement.
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { AlertCircle } from "lucide-react";

import { CloseCampaignAction, isClosable } from "@/components/campaigns/admin/closeout/close-campaign-action";
import { FinalStatementSummary } from "@/components/campaigns/admin/closeout/final-statement-summary";
import { CampaignStatusBadge } from "@/components/campaigns/admin/list/campaign-status-badge";
import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CLOSEOUT_CAMPAIGN,
  type CloseoutCampaign,
  type CloseoutCampaignData,
  type CloseoutCampaignVars,
} from "@/lib/graphql/fundraising/closeout";
import { formatNairobiDateTime } from "@/lib/receipts/format";

function CloseoutBody({ campaign, onClosed }: { campaign: CloseoutCampaign; onClosed: () => void }) {
  if (campaign.status === "CLOSED") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {campaign.closedAt ? `Closed on ${formatNairobiDateTime(campaign.closedAt)}. ` : ""}
          It no longer takes gifts, and {campaign.paybillCode} is matched to departments as normal.
        </p>
        <FinalStatementSummary campaignId={campaign.id} categoryName={campaign.categoryName} />
      </div>
    );
  }
  if (isClosable(campaign.status)) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Close the campaign when it has done its job. Any money left over stays in {campaign.categoryName}.
        </p>
        <CloseCampaignAction campaign={campaign} onClosed={onClosed} />
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">Only an active or paused campaign can be closed.</p>;
}

export const CloseoutTab: React.FC<CampaignTabProps> = ({ campaignId }) => {
  const { data, loading, error, refetch } = useQuery<CloseoutCampaignData, CloseoutCampaignVars>(CLOSEOUT_CAMPAIGN, {
    variables: { id: campaignId },
    skip: !campaignId,
  });
  const campaign = data?.campaign;

  if (loading && !campaign) {
    return <Skeleton className="h-40 w-full" data-testid="closeout-loading" />;
  }
  if (!campaign) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{error?.message || "Campaign not found"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Close out
          <span data-testid="closeout-status">
            <CampaignStatusBadge status={campaign.status} />
          </span>
        </CardTitle>
        <CardDescription>
          Closing stops gifts to {campaign.title}. Nothing is moved between departments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CloseoutBody campaign={campaign} onClosed={() => void refetch()} />
      </CardContent>
    </Card>
  );
};
