/**
 * The Statement tab's headline numbers: money in, money out and balance for
 * the period, plus a meter of received against pledged (all time).
 */

import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { formatKes } from "@/lib/receipts/format";
import type { CampaignStatement } from "@/lib/types/fundraising";
import type { PledgeCoverage } from "@/components/campaigns/admin/statement/statement-model";

interface StatementSummaryProps {
  statement: Pick<CampaignStatement, "totalIn" | "totalOut" | "balance">;
  periodLabel: string;
}

export function StatementSummary({ statement, periodLabel }: StatementSummaryProps) {
  return (
    <div data-testid="statement-summary" className="grid gap-3 sm:grid-cols-3">
      <StatCard compact title="Money in" value={formatKes(statement.totalIn)} icon={ArrowDownLeft} color="teal" subtitle={periodLabel} />
      <StatCard compact title="Money out" value={formatKes(statement.totalOut)} icon={ArrowUpRight} color="amber" subtitle={periodLabel} />
      <StatCard compact title="Balance" value={formatKes(statement.balance)} icon={Scale} color="blue" subtitle={periodLabel} />
    </div>
  );
}

export function PledgeMeter({ coverage }: { coverage: PledgeCoverage }) {
  return (
    <Card data-testid="statement-pledges">
      <CardContent className="space-y-2 pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-medium">Pledged vs received</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </div>
        <Progress
          value={Math.min(coverage.percent, 100)}
          aria-label="Received against pledged"
          aria-valuetext={`${coverage.percent}% of pledges received`}
        />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatKes(coverage.received)}</span> received of{" "}
          <span className="font-semibold text-foreground">{formatKes(coverage.pledged)}</span> pledged ·{" "}
          {coverage.percent}% of pledges
        </p>
      </CardContent>
    </Card>
  );
}
