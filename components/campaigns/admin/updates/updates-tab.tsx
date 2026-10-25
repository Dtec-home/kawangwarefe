/**
 * UpdatesTab: the Updates tab of /admin/campaigns/[id]
 * (Fundraising S2, lane S2-UI-D, ticket 2.12).
 *
 * Post news to a campaign (optionally SMS everyone who has given) and keep its
 * timeline tidy. Rendered by app/(dashboard)/admin/campaigns/[id]/page.tsx.
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { Megaphone } from "lucide-react";

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { UpdateForm } from "@/components/campaigns/admin/updates/update-form";
import { UpdateItem } from "@/components/campaigns/admin/updates/update-item";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GET_CAMPAIGN_UPDATES,
  type CampaignUpdatesData,
  type CampaignUpdatesVars,
} from "@/lib/graphql/fundraising/updates";
import type { CampaignUpdate } from "@/lib/types/fundraising";

/** Newest first; an update not yet published sorts last. */
export function newestFirst(updates: readonly CampaignUpdate[]): CampaignUpdate[] {
  const time = (u: CampaignUpdate) => (u.publishedAt ? new Date(u.publishedAt).getTime() : -Infinity);
  return [...updates].sort((a, b) => time(b) - time(a));
}

function TimelineSkeleton() {
  return (
    <div className="space-y-3" data-testid="updates-loading">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export const UpdatesTab: React.FC<CampaignTabProps> = ({ campaignId }) => {
  const { data, loading, error, refetch } = useQuery<CampaignUpdatesData, CampaignUpdatesVars>(
    GET_CAMPAIGN_UPDATES,
    { variables: { campaignId }, skip: !campaignId, notifyOnNetworkStatusChange: true }
  );
  const updates = newestFirst(data?.campaignUpdates ?? []);
  const reload = () => void refetch();

  let timeline: React.ReactNode;
  if (loading && !data) {
    timeline = <TimelineSkeleton />;
  } else if (error && !data) {
    timeline = <p className="py-8 text-center text-destructive">Could not load the updates: {error.message}</p>;
  } else if (updates.length === 0) {
    timeline = (
      <Empty
        icon={Megaphone}
        title="No updates yet"
        description="Post progress, photos and thank-yous to keep givers in the loop."
      />
    );
  } else {
    timeline = (
      <ul aria-label="Campaign updates" className="space-y-3">
        {updates.map((update) => (
          <UpdateItem key={update.id} update={update} onRemoved={reload} />
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <UpdateForm campaignId={campaignId} onPosted={reload} />
      </div>
      <section className="space-y-3 lg:col-span-3" aria-labelledby="updates-heading">
        <h2 id="updates-heading" className="text-lg font-semibold tracking-tight">
          Timeline
        </h2>
        {timeline}
      </section>
    </div>
  );
};
