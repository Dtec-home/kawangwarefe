/**
 * What counts towards a campaign, and the four-eyes change after approval
 * (ADR-0013, DEPARTMENT_CAMPAIGNS DC-4, decision D9).
 *
 * Draft and awaiting approval: the mode is set on the campaign form. Once the
 * campaign is live, a manager asks for the other mode; a second admin or pastor
 * (`canApproveCountingMode`: neither the requester nor the creator) approves or
 * turns it down; the requester may withdraw it. The backend re-checks every rule.
 */

"use client";

import { useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import { ArrowLeftRight, CheckCircle2, Hourglass, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APPROVE_CAMPAIGN_COUNTING_MODE,
  REJECT_CAMPAIGN_COUNTING_MODE,
  REQUEST_CAMPAIGN_COUNTING_MODE,
  type CampaignActionData,
} from "@/lib/graphql/fundraising/campaigns";
import type { Campaign, CampaignCountingMode } from "@/lib/types/fundraising";

import {
  countingChangeEffect,
  countingIsOnForm,
  countingModeHint,
  countingModeLabel,
  lowerFirst,
} from "./counting-mode";

type CountingCampaign = Pick<
  Campaign,
  | "id"
  | "status"
  | "categoryName"
  | "countingMode"
  | "requestedCountingMode"
  | "countingModeRequestedBy"
  | "canApproveCountingMode"
>;

type Step = "request" | "approve" | "reject" | "withdraw" | null;

interface CampaignCountingCardProps {
  campaign: CountingCampaign;
  onChanged: () => void;
}

function otherMode(mode: CampaignCountingMode): CampaignCountingMode {
  return mode === "DEPARTMENT" ? "TAGGED" : "DEPARTMENT";
}

export function CampaignCountingCard({ campaign, onChanged }: CampaignCountingCardProps) {
  const client = useApolloClient();
  const [step, setStep] = useState<Step>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const department = campaign.categoryName;
  const requested = campaign.requestedCountingMode;
  const target = requested ?? otherMode(campaign.countingMode);

  const close = () => {
    setStep(null);
    setReason("");
  };

  const run = async (mutation: DocumentNode, field: string, variables: Record<string, string>, failed: string) => {
    setBusy(true);
    try {
      const { data } = await client.mutate<CampaignActionData>({ mutation, variables: { id: campaign.id, ...variables } });
      const response = data?.[field];
      if (response?.success) {
        toast.success(response.message);
        close();
        onChanged();
      } else {
        toast.error(response?.message || failed);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : failed);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (step === "request") {
      return run(REQUEST_CAMPAIGN_COUNTING_MODE, "requestCampaignCountingMode", { mode: target }, "Could not send the request");
    }
    if (step === "approve") {
      return run(APPROVE_CAMPAIGN_COUNTING_MODE, "approveCampaignCountingMode", {}, "Could not approve the change");
    }
    return run(
      REJECT_CAMPAIGN_COUNTING_MODE,
      "rejectCampaignCountingMode",
      { reason: reason.trim() },
      step === "withdraw" ? "Could not withdraw the request" : "Could not turn the change down",
    );
  };

  const onForm = countingIsOnForm(campaign.status);
  const closed = campaign.status === "CLOSED";

  return (
    <Card data-testid="campaign-counting">
      <CardHeader>
        <CardTitle>What counts towards this campaign</CardTitle>
        <CardDescription>{countingModeLabel(campaign.countingMode, department)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{countingModeHint(campaign.countingMode, department)}</p>

        {onForm ? (
          <p className="text-xs text-muted-foreground">
            Set on the campaign form until the campaign is approved.
          </p>
        ) : requested ? (
          <Alert>
            <Hourglass />
            <AlertTitle>Waiting for a second approver</AlertTitle>
            <AlertDescription>
              Change to “{countingModeLabel(requested, department)}”
              {campaign.countingModeRequestedBy ? `, asked by ${campaign.countingModeRequestedBy}` : ""}.
              {campaign.canApproveCountingMode
                ? ""
                : " Another admin or pastor, not the person who asked or created the campaign, must approve it."}
            </AlertDescription>
            <div className="col-start-2 mt-2 flex flex-wrap gap-2">
              {campaign.canApproveCountingMode ? (
                <>
                  <Button size="sm" disabled={busy} onClick={() => setStep("approve")}>
                    <CheckCircle2 className="size-4" /> Approve change
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setStep("reject")}>
                    <XCircle className="size-4" /> Turn down
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setStep("withdraw")}>
                  <XCircle className="size-4" /> Withdraw request
                </Button>
              )}
            </div>
          </Alert>
        ) : closed ? null : (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => setStep("request")}>
            <ArrowLeftRight className="size-4" /> Ask to count {lowerFirst(countingModeLabel(target, department))}
          </Button>
        )}
      </CardContent>

      <AlertDialog open={step === "request" || step === "approve"} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {step === "approve" ? "Approve the change?" : "Ask for this change?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Count “{countingModeLabel(target, department)}”. {countingChangeEffect(target, department)}
              {step === "request" ? " Another admin or pastor must approve it before anything changes." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void confirm(); }}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {step === "approve" ? "Approve change" : "Send for approval"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={step === "reject" || step === "withdraw"} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{step === "withdraw" ? "Withdraw the request" : "Turn the change down"}</DialogTitle>
            <DialogDescription>The campaign keeps counting as it does now. The reason goes to the audit log.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="counting-reason">Reason</Label>
            <Textarea
              id="counting-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wait until the land committee agrees"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={close}>
              Cancel
            </Button>
            <Button disabled={busy || !reason.trim()} onClick={() => void confirm()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {step === "withdraw" ? "Withdraw request" : "Turn down"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
