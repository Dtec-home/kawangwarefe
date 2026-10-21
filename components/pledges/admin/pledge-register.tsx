/**
 * Pledge register (Fundraising S3, lane S3-UI-F, tickets 3.11 and 3.12):
 * totals, filters, the pledges, export, "Record a pledge card" and cancel.
 *
 * `/admin/pledges` renders it for the whole church; a campaign's Pledges tab
 * renders it with `campaignId`, which fixes the scope to that campaign. The
 * backend limits category admins to their own departments.
 */

"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { HandCoins, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GET_PLEDGES,
  GET_PLEDGE_SUMMARY,
  type PledgeScope,
  type PledgeSummaryData,
  type PledgeSummaryVars,
  type PledgesData,
  type PledgesVars,
} from "@/lib/graphql/fundraising/admin-pledges";
import type { Pledge, PledgeStatus } from "@/lib/types/fundraising";

import { CancelPledgeDialog } from "./cancel-pledge-dialog";
import { ExportPledgesButtons } from "./export-pledges-buttons";
import { ALL, NO_FILTERS, PledgeFilters, type PledgeFilterValues } from "./pledge-filters";
import { PledgeSummaryCards } from "./pledge-summary-cards";
import { PledgeTable } from "./pledge-table";
import { RecordPledgeDialog } from "./record-pledge-dialog";

export interface PledgeRegisterProps {
  /** Limit the register to one campaign (its Pledges tab). */
  campaignId?: string;
}

const orNull = (value: string) => (value === ALL ? null : value);

/** What the totals, the list and the export are limited to. */
export function pledgeScope(filters: PledgeFilterValues, campaignId?: string): PledgeScope {
  if (campaignId) return { campaignId, categoryId: null };
  return { campaignId: orNull(filters.campaign), categoryId: orNull(filters.department) };
}

function isFiltered(filters: PledgeFilterValues): boolean {
  return (
    filters.campaign !== ALL || filters.department !== ALL || filters.status !== ALL || filters.search !== ""
  );
}

export function PledgeRegister({ campaignId }: PledgeRegisterProps) {
  const [filters, setFilters] = useState<PledgeFilterValues>(NO_FILTERS);
  const [recording, setRecording] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Pledge | null>(null);
  // Remounts the filters so "Clear filters" also empties the search box.
  const [filtersKey, setFiltersKey] = useState(0);

  const scope = pledgeScope(filters, campaignId);
  const { data, loading, error } = useQuery<PledgesData, PledgesVars>(GET_PLEDGES, {
    variables: {
      ...scope,
      status: orNull(filters.status) as PledgeStatus | null,
      search: filters.search || null,
    },
    fetchPolicy: "cache-and-network",
  });
  const summary = useQuery<PledgeSummaryData, PledgeSummaryVars>(GET_PLEDGE_SUMMARY, {
    variables: scope,
    fetchPolicy: "cache-and-network",
  });

  const pledges = data?.pledges ?? [];
  const filtered = isFiltered(filters);
  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setFiltersKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ExportPledgesButtons scope={scope} />
        <Button onClick={() => setRecording(true)}>
          <Plus className="size-4" />
          Record a pledge card
        </Button>
      </div>

      <PledgeSummaryCards summary={summary.data?.pledgeSummary} loading={summary.loading} />

      <PledgeFilters key={filtersKey} value={filters} onChange={setFilters} showScope={!campaignId} />

      <Card>
        <CardContent className="pt-6">
          {loading && !data && (
            <div className="space-y-2" data-testid="pledges-loading">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && !data && (
            <p className="py-8 text-center text-destructive">Could not load pledges: {error.message}</p>
          )}

          {data && pledges.length === 0 &&
            (filtered ? (
              <Empty
                icon={HandCoins}
                title="No pledges match"
                description="Try another status, or clear the search and filters."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <Empty
                icon={HandCoins}
                title="No pledges yet"
                description="Pledges made online, on the public page or on paper cards appear here."
              />
            ))}

          {pledges.length > 0 && <PledgeTable pledges={pledges} showTarget={!campaignId} onCancel={setCancelTarget} />}
        </CardContent>
      </Card>

      <RecordPledgeDialog open={recording} onOpenChange={setRecording} fixedCampaignId={campaignId} />
      <CancelPledgeDialog pledge={cancelTarget} onClose={() => setCancelTarget(null)} />
    </div>
  );
}
