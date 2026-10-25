/**
 * LeaderboardSlot — the champion leaderboard on the public campaign page
 * (Fundraising S5 slot, hosted by components/campaigns/public/campaign-page-view.tsx;
 * lane S5-UI-I, ticket 5.8).
 *
 * When the campaign allows champions: the top 10 by `campaignLeaderboard`
 * (rank, champion name, raised, donors; totals only, never donor names),
 * each linking to the champion's page. With none yet, a short invitation to
 * become one (joining happens on /champion). Renders nothing otherwise, or
 * when the leaderboard cannot be loaded (the page stands without it).
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKes } from "@/lib/receipts/format";
import {
  CAMPAIGN_LEADERBOARD,
  type CampaignLeaderboardData,
  type CampaignLeaderboardVars,
} from "@/lib/graphql/fundraising/public-champions";
import type { LeaderboardEntry, PublicCampaign } from "@/lib/types/fundraising";
import { cn } from "@/lib/utils";
import { championPath, donorsLabel } from "./champion-format";

export interface LeaderboardSlotProps {
  campaign: Pick<PublicCampaign, "slug" | "allowChampions">;
}

export const LEADERBOARD_SIZE = 10;

export const LeaderboardSlot: React.FC<LeaderboardSlotProps> = ({ campaign }) => {
  if (!campaign.allowChampions) return null;
  return <Leaderboard slug={campaign.slug} />;
};

function Leaderboard({ slug }: { slug: string }) {
  const { data, loading, error } = useQuery<CampaignLeaderboardData, CampaignLeaderboardVars>(CAMPAIGN_LEADERBOARD, {
    variables: { slug, limit: LEADERBOARD_SIZE },
    fetchPolicy: "no-cache",
  });

  if (loading && !data) return <Skeleton data-testid="leaderboard-loading" className="h-48 rounded-2xl" />;
  if (error || !data) return null;

  const entries = data.campaignLeaderboard;
  return (
    <section
      data-slot="champion-leaderboard"
      aria-labelledby={`leaderboard-${slug}`}
      className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="space-y-1">
        <h2 id={`leaderboard-${slug}`} className="flex items-center gap-2 font-semibold">
          <Trophy className="size-5 text-primary" aria-hidden="true" />
          Champions
        </h2>
        <p className="text-sm text-muted-foreground">
          Church members raising funds for this campaign among family and friends.
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="font-medium">No champions yet.</p>
          <p className="mt-1 text-muted-foreground">
            Members can raise funds with their own link and see who gives through it.{" "}
            <Link href="/champion" className="font-medium text-primary underline-offset-4 hover:underline">
              Become a champion
            </Link>
          </p>
        </div>
      ) : (
        <ol aria-label="Top champions" className="divide-y">
          {entries.map((entry) => (
            <LeaderboardRow key={entry.code} slug={slug} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  );
}

function LeaderboardRow({ slug, entry }: { slug: string; entry: LeaderboardEntry }) {
  const top = entry.rank <= 3;
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        aria-label={`Rank ${entry.rank}`}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
          top ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {entry.rank}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={championPath(slug, entry.code)}
          className="block truncate font-medium underline-offset-4 hover:underline"
        >
          {entry.championName}
        </Link>
        <p className="text-xs text-muted-foreground">{donorsLabel(entry.donorCount)}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatKes(entry.raised)}</span>
    </li>
  );
}
