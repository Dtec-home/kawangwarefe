/**
 * CampaignProgress — raised vs target, percent and donor count
 * (Fundraising S0, shared by admin, public, champion and mobile-web pages).
 *
 * Shows totals only, never names, so it is safe on public pages.
 */

import { Progress } from "@/components/ui/progress";
import { formatKes } from "@/lib/receipts/format";
import type { CampaignProgress as Figures } from "@/lib/types/fundraising";
import { cn } from "@/lib/utils";

interface CampaignProgressProps {
  progress: Figures;
  /** Also show the total pledged (pledges are promises, not money received). */
  showPledged?: boolean;
  className?: string;
}

export function CampaignProgress({ progress, showPledged = false, className }: CampaignProgressProps) {
  const bar = Math.min(Math.max(progress.percent, 0), 100);
  const donors = `${progress.donorCount} ${progress.donorCount === 1 ? "donor" : "donors"}`;
  return (
    <div data-slot="campaign-progress" className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p>
          <span className="text-2xl font-bold tabular-nums">{formatKes(progress.raised)}</span>{" "}
          <span className="text-sm text-muted-foreground">of {formatKes(progress.target)}</span>
        </p>
        <span className="text-sm font-semibold tabular-nums">{Math.round(progress.percent)}%</span>
      </div>
      <Progress
        value={bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={bar}
        aria-label="Raised towards target"
      />
      <div className="flex flex-wrap justify-between gap-x-4 text-sm text-muted-foreground">
        <span>{donors}</span>
        {showPledged ? <span>{formatKes(progress.pledged)} pledged</span> : null}
      </div>
    </div>
  );
}
