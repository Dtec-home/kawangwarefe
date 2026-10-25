/**
 * ChampionsTab — the Champions tab of /admin/campaigns/[id] (Fundraising S5,
 * lane S5-UI-J, ticket 5.10). Rendered by components/campaigns/admin/campaign-tabs.ts.
 *
 * Every champion with what they raised, invite by phone, approve pending
 * requests and deactivate (with a confirmation).
 */

"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, ExternalLink, Megaphone, UserPlus } from "lucide-react";

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { ChampionStatusBadge } from "@/components/champions/dashboard/champion-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CAMPAIGN_CHAMPIONS,
  type CampaignChampionsData,
  type CampaignChampionsVars,
} from "@/lib/graphql/fundraising/champions";
import { formatKes } from "@/lib/receipts/format";
import type { Champion } from "@/lib/types/fundraising";

import { ChampionRowActions } from "./champion-row-actions";
import { InviteChampionDialog } from "./invite-champion-dialog";

const NOT_ALLOWED =
  "This campaign does not take champions. To allow them, use Edit on the Overview tab and turn on \"Allow champions\".";

export const ChampionsTab: React.FC<CampaignTabProps> = ({ campaignId }) => {
  const [inviting, setInviting] = useState(false);
  const { data, loading, error, refetch } = useQuery<CampaignChampionsData, CampaignChampionsVars>(
    CAMPAIGN_CHAMPIONS,
    { variables: { campaignId }, skip: !campaignId }
  );
  const campaign = data?.campaign;
  const champions = data?.champions ?? [];
  const reload = () => void refetch();

  if (loading && !data) {
    return <Skeleton className="h-40 w-full" data-testid="champions-loading" />;
  }
  if (!campaign) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{error?.message || "Campaign not found"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Champions</CardTitle>
          <CardDescription>
            Members who raise money for {campaign.title} with their own link and code, for example{" "}
            <span className="font-mono">{campaign.paybillCode} JOHN</span>.
          </CardDescription>
        </div>
        <Button onClick={() => setInviting(true)} disabled={!campaign.allowChampions}>
          <UserPlus className="size-4" aria-hidden="true" />
          Invite a champion
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!campaign.allowChampions && champions.length > 0 ? (
          <Alert>
            <AlertCircle />
            <AlertDescription>{NOT_ALLOWED}</AlertDescription>
          </Alert>
        ) : null}
        {champions.length === 0 ? (
          campaign.allowChampions ? (
            <Empty
              icon={Megaphone}
              title="No champions yet"
              description="Champions share the campaign with friends and family and see who gave through them. Invite a member, or approve members who ask to join from their champion pages."
            />
          ) : (
            <Empty icon={Megaphone} title="Champions are turned off" description={NOT_ALLOWED} />
          )
        ) : (
          <ChampionsTable champions={champions} onChanged={reload} />
        )}
      </CardContent>

      <InviteChampionDialog
        campaignId={campaign.id}
        paybillCode={campaign.paybillCode}
        open={inviting}
        onOpenChange={setInviting}
        onInvited={reload}
      />
    </Card>
  );
};

function ChampionsTable({ champions, onChanged }: { champions: Champion[]; onChanged: () => void }) {
  return (
    <Table aria-label="Champions">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Raised</TableHead>
          <TableHead className="text-right">Donors</TableHead>
          <TableHead className="text-right">Personal target</TableHead>
          <TableHead>Page</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {champions.map((champion) => (
          <TableRow key={champion.id} aria-label={champion.memberName}>
            <TableCell className="font-medium">{champion.memberName}</TableCell>
            <TableCell className="font-mono">{champion.code}</TableCell>
            <TableCell>
              <ChampionStatusBadge status={champion.status} />
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatKes(champion.raised)}</TableCell>
            <TableCell className="text-right tabular-nums">{champion.donorCount}</TableCell>
            <TableCell className="text-right tabular-nums">
              {champion.personalTarget ? formatKes(champion.personalTarget) : "—"}
            </TableCell>
            <TableCell>
              <a
                href={champion.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
                aria-label={`Open ${champion.memberName}'s champion page`}
              >
                Open <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </TableCell>
            <TableCell className="text-right">
              <ChampionRowActions champion={champion} onChanged={onChanged} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
