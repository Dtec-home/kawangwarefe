/**
 * /champion — the member's champion pages, with links to each dashboard, and
 * "Become a champion" (Fundraising S5, lane S5-UI-J, ticket 5.9).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { ChevronRight, Megaphone, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MY_CHAMPIONSHIPS, type MyChampionshipsData } from "@/lib/graphql/fundraising/champions";
import { formatKes } from "@/lib/receipts/format";
import type { Champion } from "@/lib/types/fundraising";

import { ChampionStatusBadge } from "./champion-status-badge";
import { JoinChampionDialog } from "./join-champion-dialog";

export function MyChampionshipsView() {
  const { data, loading, error, refetch } = useQuery<MyChampionshipsData>(MY_CHAMPIONSHIPS);
  const [joining, setJoining] = useState(false);
  const championships = data?.myChampionships ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My champion pages"
        description="Campaigns you raise money for, with your own link and code."
        actions={
          <Button onClick={() => setJoining(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Become a champion
          </Button>
        }
      />

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2" data-testid="my-championships-loading">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : error && !data ? (
        <Empty
          icon={RefreshCw}
          title="Your champion pages could not be loaded"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : championships.length === 0 ? (
        <Empty
          icon={Megaphone}
          title="You are not a champion yet"
          description="Champions share a campaign with friends and family and see who gave through them."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="My champion pages">
          {championships.map((champion) => (
            <li key={champion.id}>
              <ChampionshipCard champion={champion} />
            </li>
          ))}
        </ul>
      )}

      <JoinChampionDialog open={joining} onOpenChange={setJoining} />
    </div>
  );
}

function ChampionshipCard({ champion }: { champion: Champion }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full items-center gap-4 pt-6">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/champion/${champion.id}`}
              className="truncate font-semibold hover:underline"
              aria-label={`${champion.campaignTitle} champion page`}
            >
              {champion.campaignTitle}
            </Link>
            <ChampionStatusBadge status={champion.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Code <span className="font-mono">{champion.code}</span> · {formatKes(champion.raised)} from{" "}
            {champion.donorCount} {champion.donorCount === 1 ? "donor" : "donors"}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}
