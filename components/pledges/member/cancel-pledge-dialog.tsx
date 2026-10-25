/**
 * Cancel one of the member's own open pledges, with a reason
 * (S3-UI-E, ticket 3.8). The backend audit-logs the reason.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
  type CancelPledgeData,
  type CancelPledgeVars,
  type MyPledge,
} from "@/lib/graphql/fundraising/member-pledges";
import { formatKes } from "@/lib/receipts/format";

import { pledgeTargetName } from "./pledge-display";

export const MIN_CANCEL_REASON_LENGTH = 5;
const FAILED = "Could not cancel the pledge";

interface CancelPledgeDialogProps {
  /** The pledge to cancel; null keeps the dialog closed. */
  pledge: MyPledge | null;
  onClose: () => void;
}

export function CancelPledgeDialog({ pledge, onClose }: CancelPledgeDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [cancelPledge, { loading }] = useMutation<CancelPledgeData, CancelPledgeVars>(CANCEL_PLEDGE);

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
        setError(result?.message || FAILED);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : FAILED);
    }
  };

  return (
    <Dialog open={pledge !== null} onOpenChange={(open) => (!open ? close() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this pledge?</DialogTitle>
          <DialogDescription>
            {pledge
              ? `Your pledge of ${formatKes(pledge.amount)} to ${pledgeTargetName(pledge)} will be cancelled. What you have already given stays given.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-pledge-reason">Reason</Label>
          <Textarea
            id="cancel-pledge-reason"
            rows={3}
            value={reason}
            placeholder="e.g. My circumstances have changed"
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-xs text-muted-foreground">The church office sees this reason.</p>
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
