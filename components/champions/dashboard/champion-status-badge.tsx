/**
 * Champion status pill (Fundraising S5, lane S5-UI-J).
 */

import { StatusBadge } from "@/components/ui/status-badge";
import type { ChampionStatus } from "@/lib/types/fundraising";

import { CHAMPION_STATUS_VARIANTS, championStatusLabel } from "./champion-display";

export function ChampionStatusBadge({ status }: { status: ChampionStatus }) {
  return (
    <StatusBadge variant={CHAMPION_STATUS_VARIANTS[status] ?? "neutral"} data-testid="champion-status">
      {championStatusLabel(status)}
    </StatusBadge>
  );
}
