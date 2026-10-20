/**
 * Send a campaign awaiting approval back to draft, with a reason
 * (Fundraising S1, ticket 1.11). The backend audit-logs the reason.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  RETURN_CAMPAIGN_TO_DRAFT,
  type CampaignActionData,
  type ReturnCampaignToDraftVars,
} from "@/lib/graphql/fundraising/campaigns";

export const MIN_RETURN_REASON_LENGTH = 5;
const FAILED = "Could not return the campaign to draft";

interface ReturnToDraftDialogProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReturned?: () => void;
}

export function ReturnToDraftDialog({ campaignId, open, onOpenChange, onReturned }: ReturnToDraftDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [returnToDraft, { loading }] = useMutation<CampaignActionData, ReturnCampaignToDraftVars>(
    RETURN_CAMPAIGN_TO_DRAFT
  );

  const close = (next: boolean) => {
    if (!next) {
      setReason("");
      setError("");
    }
    onOpenChange(next);
  };

  const confirm = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_RETURN_REASON_LENGTH) {
      setError(`Give a reason of at least ${MIN_RETURN_REASON_LENGTH} characters.`);
      return;
    }
    setError("");
    try {
      const { data } = await returnToDraft({ variables: { id: campaignId, reason: trimmed } });
      const result = data?.returnCampaignToDraft;
      if (result?.success) {
        toast.success(result.message || "Returned to draft");
        onReturned?.();
        close(false);
      } else {
        toast.error(result?.message || FAILED);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : FAILED);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return to draft</DialogTitle>
          <DialogDescription>
            The campaign goes back to its creator to change, and must be submitted again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="return-reason">Reason</Label>
          <Textarea
            id="return-reason"
            rows={3}
            value={reason}
            placeholder="e.g. The target needs the board's sign-off"
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Saved in the audit log.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Return to draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
