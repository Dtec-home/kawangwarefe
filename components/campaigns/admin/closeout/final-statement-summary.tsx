/**
 * Compact final statement of a closed campaign: money in, money out and what
 * is left over (Fundraising S4, lane S4-UI-H, ticket 4.9). The full ledger is
 * the Statement tab.
 */

"use client";

import { useQuery } from "@apollo/client/react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CAMPAIGN_FINAL_STATEMENT,
  type CampaignFinalStatementData,
  type CampaignFinalStatementVars,
} from "@/lib/graphql/fundraising/closeout";
import { formatKes } from "@/lib/receipts/format";

interface FinalStatementSummaryProps {
  campaignId: string;
  categoryName: string;
}

export function FinalStatementSummary({ campaignId, categoryName }: FinalStatementSummaryProps) {
  const { data, loading, error } = useQuery<CampaignFinalStatementData, CampaignFinalStatementVars>(
    CAMPAIGN_FINAL_STATEMENT,
    { variables: { campaignId } }
  );
  const statement = data?.campaignStatement;

  let body: React.ReactNode;
  if (loading && !statement) {
    body = <Skeleton className="h-20 w-full" />;
  } else if (!statement) {
    body = (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{error?.message || "Could not load the final statement"}</AlertDescription>
      </Alert>
    );
  } else {
    body = (
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Money in</dt>
          <dd data-testid="statement-in" className="mt-1 text-lg font-semibold tabular-nums">
            {formatKes(statement.totalIn)}
          </dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Money out</dt>
          <dd data-testid="statement-out" className="mt-1 text-lg font-semibold tabular-nums">
            {formatKes(statement.totalOut)}
          </dd>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Left over</dt>
          <dd data-testid="statement-balance" className="mt-1 text-lg font-semibold tabular-nums">
            {formatKes(statement.balance)}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">Stays in {categoryName}</dd>
        </div>
      </dl>
    );
  }

  return (
    <section aria-labelledby="final-statement-heading" className="space-y-3">
      <h3 id="final-statement-heading" className="font-semibold">
        Final statement
      </h3>
      {body}
      <p className="text-xs text-muted-foreground">See the Statement tab for every entry.</p>
    </section>
  );
}
