/**
 * "Become a champion" (Fundraising S5, lane S5-UI-J, ticket 5.9): pick a
 * public campaign that takes champions, choose a code and an optional
 * personal target → joinAsChampion. The request then waits for staff approval.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CHAMPION_JOIN_CAMPAIGNS,
  JOIN_AS_CHAMPION,
  MY_CHAMPIONSHIPS,
  type ChampionJoinCampaignsData,
  type JoinAsChampionData,
  type JoinAsChampionVars,
} from "@/lib/graphql/fundraising/champions";
import type { Champion } from "@/lib/types/fundraising";

import { CHAMPION_CODE_HINT, championCodeError, normalizeChampionCode, personalTargetError } from "./champion-display";

const FAILED = "Could not send your request";

interface Errors {
  campaign?: string;
  code?: string;
  personalTarget?: string;
}

interface JoinChampionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinChampionDialog({ open, onOpenChange }: JoinChampionDialogProps) {
  const [campaignId, setCampaignId] = useState("");
  const [code, setCode] = useState("");
  const [personalTarget, setPersonalTarget] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [joined, setJoined] = useState<Champion | null>(null);

  // publicCampaigns has no id, so keep it out of the shared cache.
  const campaigns = useQuery<ChampionJoinCampaignsData>(CHAMPION_JOIN_CAMPAIGNS, {
    skip: !open,
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  });
  const [join, { loading }] = useMutation<JoinAsChampionData, JoinAsChampionVars>(JOIN_AS_CHAMPION, {
    refetchQueries: [{ query: MY_CHAMPIONSHIPS }],
    awaitRefetchQueries: true,
  });

  const options = (campaigns.data?.publicCampaigns ?? []).filter((c) => c.allowChampions && c.isAcceptingGifts);
  const chosen = options.find((c) => c.campaignId === campaignId);

  const close = (next: boolean) => {
    if (!next) {
      setCampaignId("");
      setCode("");
      setPersonalTarget("");
      setErrors({});
      setServerError(null);
      setJoined(null);
    }
    onOpenChange(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: Errors = {};
    if (!campaignId) found.campaign = "Choose a campaign";
    const codeError = championCodeError(code);
    if (codeError) found.code = codeError;
    const targetError = personalTargetError(personalTarget);
    if (targetError) found.personalTarget = targetError;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError(null);
    try {
      const { data } = await join({
        variables: { campaignId, code, personalTarget: personalTarget.trim() || null },
      });
      const result = data?.joinAsChampion;
      if (result?.success && result.champion) {
        toast.success(result.message || "Request sent");
        setJoined(result.champion);
      } else {
        setServerError(result?.message || FAILED);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : FAILED);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Become a champion</DialogTitle>
          <DialogDescription>
            Raise money for a campaign from friends and family with your own link and code. You&apos;ll see who gave
            through you and how much.
          </DialogDescription>
        </DialogHeader>

        {joined ? (
          <div className="space-y-4">
            <Alert>
              <Clock />
              <AlertTitle>Waiting for approval</AlertTitle>
              <AlertDescription>
                Your request to champion {joined.campaignTitle} with code{" "}
                <span className="font-mono">{joined.code}</span> has been sent. Church staff will approve it soon.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" onClick={() => close(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate aria-label="Become a champion">
            <div className="space-y-2">
              <Label htmlFor="champion-campaign">Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger
                  id="champion-campaign"
                  className="w-full"
                  aria-invalid={errors.campaign ? true : undefined}
                >
                  <SelectValue placeholder={campaigns.loading ? "Loading campaigns…" : "Choose a campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((c) => (
                    <SelectItem key={c.campaignId} value={c.campaignId}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!campaigns.loading && options.length === 0 ? (
                <p className="text-xs text-muted-foreground">No campaign is taking champions right now.</p>
              ) : null}
              {errors.campaign ? <p className="text-xs text-destructive">{errors.campaign}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="champion-code">
                Your code<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="champion-code"
                autoComplete="off"
                maxLength={9}
                placeholder="JOHN"
                className="font-mono uppercase"
                value={code}
                onChange={(e) => setCode(normalizeChampionCode(e.target.value))}
                aria-invalid={errors.code ? true : undefined}
                aria-describedby="champion-code-hint"
              />
              <p id="champion-code-hint" className="text-xs text-muted-foreground">
                {chosen && code
                  ? `Givers will use M-Pesa account ${chosen.paymentInstructions.accountReference} ${code}.`
                  : CHAMPION_CODE_HINT}
              </p>
              {errors.code ? <p className="text-xs text-destructive">{errors.code}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="champion-target">Personal target (KES, optional)</Label>
              <Input
                id="champion-target"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="20000"
                value={personalTarget}
                onChange={(e) => setPersonalTarget(e.target.value)}
                aria-invalid={errors.personalTarget ? true : undefined}
              />
              {errors.personalTarget ? <p className="text-xs text-destructive">{errors.personalTarget}</p> : null}
            </div>

            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Send request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
