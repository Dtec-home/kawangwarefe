/**
 * ChampionTotals — what one champion has raised, from how many donors, and
 * their personal target if they set one (S5-UI-I, ticket 5.7). Totals only.
 */

import { Progress } from "@/components/ui/progress";
import { formatKes } from "@/lib/receipts/format";
import { donorsLabel, firstName, targetPercent } from "./champion-format";

interface ChampionTotalsProps {
  championName: string;
  raised: string;
  donorCount: number;
  personalTarget: string | null;
}

export function ChampionTotals({ championName, raised, donorCount, personalTarget }: ChampionTotalsProps) {
  const percent = targetPercent(raised, personalTarget);
  const bar = percent === null ? 0 : Math.min(Math.max(percent, 0), 100);
  return (
    <section
      aria-label={`What ${firstName(championName)} has raised`}
      data-testid="champion-totals"
      className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <p className="text-4xl font-bold tracking-tight tabular-nums text-primary sm:text-5xl">{formatKes(raised)}</p>
        <p className="pb-1 text-sm text-muted-foreground">
          raised by {firstName(championName)} from <span className="font-semibold text-foreground">{donorsLabel(donorCount)}</span>
        </p>
      </div>
      {percent !== null && personalTarget ? (
        <div data-testid="champion-target" className="space-y-2">
          <Progress
            value={bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={bar}
            aria-label={`Raised towards ${firstName(championName)}'s target`}
            className="h-3"
          />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{percent}%</span> of{" "}
            {firstName(championName)}&apos;s target of{" "}
            <span className="tabular-nums">{formatKes(personalTarget)}</span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
