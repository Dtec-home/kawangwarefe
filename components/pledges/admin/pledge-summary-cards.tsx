/**
 * Totals above a pledge register: pledged, paid, outstanding and how many
 * pledges (Fundraising S3, lane S3-UI-F, ticket 3.11).
 */

import { CircleDollarSign, HandCoins, Hourglass, ListChecks } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { formatKes } from "@/lib/receipts/format";
import type { PledgeSummary } from "@/lib/types/fundraising";

interface PledgeSummaryCardsProps {
  summary: PledgeSummary | undefined;
  loading: boolean;
}

export function PledgeSummaryCards({ summary, loading }: PledgeSummaryCardsProps) {
  if (!summary) {
    if (!loading) return null;
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="pledge-summary-loading">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Pledge totals" role="group">
      <div data-testid="pledge-total-pledged">
        <StatCard compact title="Pledged" value={formatKes(summary.pledged)} icon={HandCoins} color="teal" />
      </div>
      <div data-testid="pledge-total-paid">
        <StatCard compact title="Paid" value={formatKes(summary.paid)} icon={CircleDollarSign} color="emerald" />
      </div>
      <div data-testid="pledge-total-outstanding">
        <StatCard compact title="Outstanding" value={formatKes(summary.outstanding)} icon={Hourglass} color="amber" />
      </div>
      <div data-testid="pledge-total-count">
        <StatCard
          compact
          title="Pledges"
          value={summary.pledgeCount.toLocaleString("en-KE")}
          icon={ListChecks}
          color="blue"
        />
      </div>
    </div>
  );
}
