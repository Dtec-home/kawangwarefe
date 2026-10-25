"use client";

/**
 * StatementTab: the campaign's own books (Fundraising S4, lane S4-UI-G).
 *
 * One period row scopes everything below it: the summary tiles, the charts,
 * the statement table and the Excel / PDF export. Pledged vs received comes
 * from the campaign's progress (S1 GET_CAMPAIGN, usually already cached) and
 * is always all time. A refetch keeps the previous statement on screen,
 * dimmed, instead of flashing a skeleton.
 */

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, ReceiptText } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { StatementCharts } from "@/components/campaigns/admin/statement/statement-charts";
import { StatementExport } from "@/components/campaigns/admin/statement/statement-export";
import {
  ALL_TIME,
  describePeriod,
  periodError,
  pledgeCoverage,
} from "@/components/campaigns/admin/statement/statement-model";
import { StatementPeriodPicker } from "@/components/campaigns/admin/statement/statement-period";
import { PledgeMeter, StatementSummary } from "@/components/campaigns/admin/statement/statement-summary";
import { StatementTable } from "@/components/campaigns/admin/statement/statement-table";
import { GET_CAMPAIGN, type CampaignData, type CampaignVars } from "@/lib/graphql/fundraising/campaigns";
import {
  GET_CAMPAIGN_STATEMENT,
  type CampaignStatementData,
  type CampaignStatementVars,
  type StatementPeriod,
} from "@/lib/graphql/fundraising/statement";

export const StatementTab: React.FC<CampaignTabProps> = ({ campaignId }) => {
  const [period, setPeriod] = useState<StatementPeriod>(ALL_TIME);
  const invalid = periodError(period);
  const periodLabel = describePeriod(period);

  const { data, previousData, loading, error, refetch } = useQuery<CampaignStatementData, CampaignStatementVars>(
    GET_CAMPAIGN_STATEMENT,
    { variables: { campaignId, ...period }, skip: invalid !== null, notifyOnNetworkStatusChange: true }
  );
  const { data: campaignData } = useQuery<CampaignData, CampaignVars>(GET_CAMPAIGN, { variables: { id: campaignId } });

  const statement = (data ?? previousData)?.campaignStatement;
  const coverage = pledgeCoverage(campaignData?.campaign?.progress);

  let body: React.ReactNode;
  if (invalid) {
    body = null;
  } else if (error && !loading) {
    body = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load the statement</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {error.message}
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  } else if (!statement) {
    body = (
      <div data-testid="statement-loading" className="space-y-4" aria-busy="true">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-60" />
      </div>
    );
  } else if (statement.rows.length === 0) {
    body = (
      <Card>
        <CardContent>
          <Empty
            icon={ReceiptText}
            title="No money yet"
            description={
              periodLabel === "All time"
                ? "Nothing has come in or gone out for this campaign yet."
                : "Nothing came in or went out in this period."
            }
          />
        </CardContent>
      </Card>
    );
  } else {
    body = (
      <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        <StatementSummary statement={statement} periodLabel={periodLabel} />
        <StatementCharts rows={statement.rows} />
        <Card>
          <CardContent className="pt-4">
            <StatementTable statement={statement} periodLabel={periodLabel} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StatementPeriodPicker value={period} onChange={setPeriod} />
        <StatementExport campaignId={campaignId} period={period} disabled={invalid !== null} />
      </div>
      <p className="text-sm text-muted-foreground" data-testid="statement-period">
        Showing: {periodLabel}
      </p>
      {invalid && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {invalid}
        </p>
      )}
      {coverage && <PledgeMeter coverage={coverage} />}
      {body}
    </div>
  );
};
