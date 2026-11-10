/**
 * OwnGivingCard (ADR-0016, CH-2): the champion's switch for showing their own
 * giving on their page, link preview and share message, with their real
 * total and a one-time notice for champions who had pages before this.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { wholeKes } from "@/components/campaigns/public/server/campaign-meta";
import {
  DISMISS_OWN_GIVING_NOTICE,
  SET_CHAMPION_SHOW_OWN_GIVING,
  type OwnGivingResult,
} from "@/lib/graphql/fundraising/champions";
import type { Champion } from "@/lib/types/fundraising";

type OwnGivingChampion = Pick<Champion, "id" | "showOwnGiving" | "ownGiven" | "ownGivingNoticePending">;

export function OwnGivingCard({ champion, onChanged }: { champion: OwnGivingChampion; onChanged?: () => void }) {
  const [shown, setShown] = useState(champion.showOwnGiving);
  const [notice, setNotice] = useState(champion.ownGivingNoticePending);
  const [setShow, { loading }] = useMutation<{ setChampionShowOwnGiving: OwnGivingResult }>(SET_CHAMPION_SHOW_OWN_GIVING);
  const [dismiss] = useMutation<{ dismissOwnGivingNotice: OwnGivingResult }>(DISMISS_OWN_GIVING_NOTICE);
  const given = Number(champion.ownGiven) || 0;

  const toggle = async (next: boolean) => {
    setShown(next);
    try {
      const { data } = await setShow({ variables: { championId: champion.id, show: next } });
      const result = data?.setChampionShowOwnGiving;
      if (!result?.success) throw new Error(result?.message ?? "Could not save");
      onChanged?.();
    } catch (e) {
      setShown(!next);
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <Card role="region" aria-label="Your own giving">
      <CardHeader>
        <CardTitle>Your own giving</CardTitle>
        <CardDescription>
          {given > 0 ? `You've given ${wholeKes(champion.ownGiven)} to this campaign` : "You have not given to this campaign yet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice ? (
          <Alert role="status">
            <AlertDescription className="space-y-2">
              <p>
                Your page now shows how much you have given, to encourage others. Only you can switch it off. A
                WhatsApp preview already sent keeps the figure it had.
              </p>
              <Button size="sm" variant="outline" onClick={() => {
                setNotice(false);
                void dismiss({ variables: { championId: champion.id } }).catch(() => undefined);
              }}>
                Got it
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor={`own-giving-${champion.id}`} className="text-sm font-normal">
            Show how much I&apos;ve given on my page and share message
          </Label>
          <Switch id={`own-giving-${champion.id}`} checked={shown} disabled={loading}
            onCheckedChange={(next) => void toggle(next)} />
        </div>
        <p className="text-xs text-muted-foreground">
          {given > 0
            ? "Only the total is shown, never the individual gifts. It is also added to your total on the leaderboard."
            : "Nothing is shown until you give."}
        </p>
      </CardContent>
    </Card>
  );
}
