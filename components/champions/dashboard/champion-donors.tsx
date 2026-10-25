/**
 * The champion's own donors, ranked, with names and amounts (Fundraising S5,
 * lane S5-UI-J, ticket 5.9; decision 4). Never shown on public pages.
 */

import { Lock, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { formatKes, formatNairobiDateTime } from "@/lib/receipts/format";
import type { ContributorEntry } from "@/lib/types/fundraising";

export const DONOR_PRIVACY_NOTE = "Only you and church staff can see this list";

export function ChampionDonors({ donors }: { donors: ContributorEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your donors</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Lock className="size-3.5" aria-hidden="true" />
          {DONOR_PRIVACY_NOTE}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donors.length === 0 ? (
          <Empty
            icon={Users}
            title="No gifts through you yet"
            description="Share your link or your Pay Bill account with friends and family to get started."
            className="py-6"
          />
        ) : (
          <ol aria-label="Your donors" className="divide-y">
            {donors.map((donor) => (
              <li key={`${donor.rank}-${donor.name}`} className="flex items-center gap-3 py-3">
                <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
                  {donor.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" data-testid="donor-name">
                    {donor.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {donor.giftCount} {donor.giftCount === 1 ? "gift" : "gifts"} · last on{" "}
                    {formatNairobiDateTime(donor.lastGivenAt)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums" data-testid="donor-amount">
                  {formatKes(donor.amount)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
