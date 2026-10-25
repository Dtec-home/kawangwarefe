/**
 * "My pledges": the signed-in member's pledges with totals, "Pay balance",
 * "Make a pledge" and cancel (S3-UI-E, ticket 3.8).
 */

"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { HandCoins, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MY_PLEDGES, type MyPledge, type MyPledgesData } from "@/lib/graphql/fundraising/member-pledges";
import { formatKes } from "@/lib/receipts/format";

import { CancelPledgeDialog } from "./cancel-pledge-dialog";
import { MakePledgeDialog } from "./make-pledge-dialog";
import { PledgeCard } from "./pledge-card";
import { pledgeTotals } from "./pledge-display";

export function MyPledgesView() {
  const { data, loading, error, refetch } = useQuery<MyPledgesData>(MY_PLEDGES);
  const [making, setMaking] = useState(false);
  const [cancelling, setCancelling] = useState<MyPledge | null>(null);

  const pledges = data?.myPledges ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My pledges"
        description="What you have promised to give, what you have paid and what is left."
        actions={
          <Button onClick={() => setMaking(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Make a pledge
          </Button>
        }
      />

      {loading && !data ? (
        <PledgesSkeleton />
      ) : error && !data ? (
        <Empty
          icon={RefreshCw}
          title="Your pledges could not be loaded"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : pledges.length === 0 ? (
        <Empty
          icon={HandCoins}
          title="You have no pledges yet"
          description="Pledge to a campaign or a department and give towards it over time."
          action={<Button onClick={() => setMaking(true)}>Make a pledge</Button>}
        />
      ) : (
        <>
          <PledgeTotals pledges={pledges} />
          <div className="grid gap-4 md:grid-cols-2">
            {pledges.map((pledge) => (
              <PledgeCard key={pledge.id} pledge={pledge} onCancel={setCancelling} />
            ))}
          </div>
        </>
      )}

      <MakePledgeDialog open={making} onOpenChange={setMaking} />
      <CancelPledgeDialog pledge={cancelling} onClose={() => setCancelling(null)} />
    </div>
  );
}

function PledgeTotals({ pledges }: { pledges: MyPledge[] }) {
  const totals = pledgeTotals(pledges);
  return (
    <dl aria-label="Pledge totals" className="grid grid-cols-3 gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <Total label="Pledged" value={totals.pledged} />
      <Total label="Paid" value={totals.paid} />
      <Total label="Balance" value={totals.balance} />
    </dl>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="truncate text-base font-bold tabular-nums sm:text-xl">{formatKes(value)}</dd>
    </div>
  );
}

function PledgesSkeleton() {
  return (
    <div className="space-y-4" data-testid="my-pledges-loading">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
