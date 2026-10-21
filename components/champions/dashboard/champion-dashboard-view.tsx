/**
 * A champion's own dashboard on /champion/[id] (Fundraising S5, lane S5-UI-J,
 * ticket 5.9): what they have raised, their donors with names and amounts
 * (decision 4) and the share kit. Pending and inactive pages say why there is
 * nothing to share.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft, Clock, Info, RefreshCw, SearchX } from "lucide-react";

import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHAMPION_DASHBOARD,
  type ChampionDashboardData,
  type ChampionDashboardVars,
} from "@/lib/graphql/fundraising/champions";
import { formatKes } from "@/lib/receipts/format";
import type { Champion } from "@/lib/types/fundraising";

import { personalTargetProgress } from "./champion-display";
import { ChampionDonors } from "./champion-donors";
import { ChampionShareKit } from "./champion-share-kit";
import { ChampionStatusBadge } from "./champion-status-badge";

export function ChampionDashboardView({ championId }: { championId: string }) {
  const { data, loading, error, refetch } = useQuery<ChampionDashboardData, ChampionDashboardVars>(
    CHAMPION_DASHBOARD,
    { variables: { championId }, skip: !championId }
  );
  const dashboard = data?.championDashboard;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/champion">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My champion pages
        </Link>
      </Button>

      {loading && !data ? (
        <DashboardSkeleton />
      ) : error && !data ? (
        <Empty
          icon={RefreshCw}
          title="Your champion page could not be loaded"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : !dashboard ? (
        <Empty
          icon={SearchX}
          title="Champion page not found"
          description="It may belong to someone else, or the link may be wrong."
          action={
            <Button asChild variant="outline">
              <Link href="/champion">See my champion pages</Link>
            </Button>
          }
        />
      ) : (
        <>
          <PageHeader
            title={dashboard.champion.campaignTitle}
            description={`Your champion page · code ${dashboard.champion.code}`}
            actions={<ChampionStatusBadge status={dashboard.champion.status} />}
          />
          <StatusNotice champion={dashboard.champion} />
          <Tally champion={dashboard.champion} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChampionDonors donors={dashboard.donors} />
            {dashboard.champion.status === "ACTIVE" ? <ChampionShareKit champion={dashboard.champion} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

function StatusNotice({ champion }: { champion: Champion }) {
  if (champion.status === "PENDING") {
    return (
      <Alert>
        <Clock />
        <AlertTitle>Waiting for approval</AlertTitle>
        <AlertDescription>
          Church staff will check your request. Once approved, gifts with account{" "}
          <span className="font-mono">{champion.paymentInstructions.accountReference}</span> are counted for you and
          your share kit appears here.
        </AlertDescription>
      </Alert>
    );
  }
  if (champion.status === "INACTIVE") {
    return (
      <Alert>
        <Info />
        <AlertTitle>This champion page is no longer active</AlertTitle>
        <AlertDescription>
          New gifts with your code are no longer counted for you. What you raised before is still shown below.
          Speak to church staff if you think this is a mistake.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

function Tally({ champion }: { champion: Champion }) {
  const progress = personalTargetProgress(champion);
  return (
    <Card role="region" aria-label="What you have raised">
      <CardContent className="space-y-4 pt-6">
        {progress ? (
          <>
            <p className="text-sm text-muted-foreground">Raised towards your personal target</p>
            <CampaignProgress progress={progress} />
          </>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Raised through you</dt>
              <dd className="text-2xl font-bold tabular-nums">{formatKes(champion.raised)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Donors</dt>
              <dd className="text-2xl font-bold tabular-nums">{champion.donorCount}</dd>
            </div>
          </dl>
        )}
        <p className="text-sm text-muted-foreground">
          Campaign:{" "}
          <Link href={`/campaigns/${champion.campaignSlug}`} className="font-medium text-primary hover:underline">
            {champion.campaignTitle}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" data-testid="champion-dashboard-loading">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
