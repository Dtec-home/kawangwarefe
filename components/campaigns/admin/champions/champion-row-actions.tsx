/**
 * Approve a pending champion, or deactivate an active one after a
 * confirmation (Fundraising S5, lane S5-UI-J, ticket 5.10).
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Check, Loader2, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  APPROVE_CHAMPION,
  DEACTIVATE_CHAMPION,
  type ApproveChampionData,
  type ChampionIdVars,
  type DeactivateChampionData,
} from "@/lib/graphql/fundraising/champions";
import type { Champion, ChampionResponse } from "@/lib/types/fundraising";

interface ChampionRowActionsProps {
  champion: Champion;
  onChanged: () => void;
}

function report(result: ChampionResponse | undefined, fallback: string, done: string): boolean {
  if (result?.success) {
    toast.success(result.message || done);
    return true;
  }
  toast.error(result?.message || fallback);
  return false;
}

export function ChampionRowActions({ champion, onChanged }: ChampionRowActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [approve, approving] = useMutation<ApproveChampionData, ChampionIdVars>(APPROVE_CHAMPION);
  const [deactivate, deactivating] = useMutation<DeactivateChampionData, ChampionIdVars>(DEACTIVATE_CHAMPION);

  const onApprove = async () => {
    try {
      const { data } = await approve({ variables: { id: champion.id } });
      if (report(data?.approveChampion, "Could not approve the champion", "Champion approved")) onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve the champion");
    }
  };

  const onDeactivate = async () => {
    try {
      const { data } = await deactivate({ variables: { id: champion.id } });
      if (report(data?.deactivateChampion, "Could not deactivate the champion", "Champion deactivated")) {
        setConfirming(false);
        onChanged();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deactivate the champion");
    }
  };

  if (champion.status === "PENDING") {
    return (
      <Button size="sm" onClick={onApprove} disabled={approving.loading}>
        {approving.loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Approve
      </Button>
    );
  }
  if (champion.status !== "ACTIVE") return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)} disabled={deactivating.loading}>
        <UserX className="size-4" />
        Deactivate
      </Button>
      <AlertDialog open={confirming} onOpenChange={(open) => !deactivating.loading && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {champion.memberName}?</AlertDialogTitle>
            <AlertDialogDescription>
              New gifts with code <span className="font-mono font-medium text-foreground">{champion.code}</span> will no
              longer be counted for them. What they have raised so far stays with the campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating.loading}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={onDeactivate} disabled={deactivating.loading}>
              {deactivating.loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Deactivate champion
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
