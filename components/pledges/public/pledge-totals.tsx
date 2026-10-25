/**
 * "Pledged KES X · Received KES Y" on the public pledge card (S3-UI-E,
 * ticket 3.10). Totals only, never a name, so it is safe on public pages.
 */

import { formatKes } from "@/lib/receipts/format";
import type { CampaignProgress } from "@/lib/types/fundraising";

export function PledgeTotals({ progress }: { progress: Pick<CampaignProgress, "pledged" | "raised"> }) {
  return (
    <p
      data-testid="pledge-totals"
      className="flex flex-wrap items-baseline gap-x-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground"
    >
      <span>
        Pledged <strong className="font-semibold text-foreground tabular-nums">{formatKes(progress.pledged)}</strong>
      </span>{" "}
      <span aria-hidden="true">·</span>{" "}
      <span>
        Received <strong className="font-semibold text-foreground tabular-nums">{formatKes(progress.raised)}</strong>
      </span>
    </p>
  );
}
