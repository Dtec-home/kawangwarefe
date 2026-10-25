/**
 * Cancel a pledge with a reason (Fundraising S3, lane S3-UI-F, ticket 3.11).
 * The backend records who cancelled it and why in the audit log.
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
  CANCEL_PLEDGE,
  PLEDGE_REGISTER_QUERIES,
  type CancelPledgeData,
  type CancelPledgeVars,
} from "@/lib/graphql/fundraising/admin-pledges";
import { formatKes } from "@/lib/receipts/format";
import type { Pledge } from "@/lib/types/fundraising";

import { pledgeTarget } from "./pledge-labels";

export const MIN_CANCEL_REASON_LENGTH = 5;
const FAILED = "Could not cancel the pledge";

interface CancelPledgeDialogProps {
  /** The pledge to cancel; null closes the dialog. */
  pledge: Pledge | null;
  onClose: () => void;
}

export function CancelPledgeDialog({ pledge, onClose }: CancelPledgeDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [cancelPledge, { loading }] = useMutation<CancelPledgeData, CancelPledgeVars>(CANCEL_PLEDGE, {
    refetchQueries: PLEDGE_REGISTER_QUERIES,
  });

  const close = () => {
    setReason("");
    setError("");
    onClose();
  };

  const confirm = async () => {
    if (!pledge) return;
    const trimmed = reason.trim();
    if (trimmed.length < MIN_CANCEL_REASON_LENGTH) {
      setError(`Give a reason of at least ${MIN_CANCEL_REASON_LENGTH} characters.`);
      return;
    }
    setError("");
    try {
      const { data } = await cancelPledge({ variables: { id: pledge.id, reason: trimmed } });
      const result = data?.cancelPledge;
      if (result?.success) {
        toast.success(result.message || "Pledge cancelled");
        close();
      } else {
        toast.error(result?.message || FAILED);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : FAILED);
    }
  };

  return (
    <Dialog open={pledge !== null} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel pledge</DialogTitle>
          <DialogDescription>
            {pledge
              ? `${pledge.memberName} pledged ${formatKes(pledge.amount)} to ${pledgeTarget(pledge)}. ` +
                "Money already paid stays recorded; no more reminders are sent."
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-pledge-reason">Reason</Label>
          <Textarea
            id="cancel-pledge-reason"
            rows={3}
            value={reason}
            placeholder="e.g. Recorded twice by mistake"
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
          <Button variant="outline" onClick={close} disabled={loading}>
            Keep pledge
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Cancel pledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
