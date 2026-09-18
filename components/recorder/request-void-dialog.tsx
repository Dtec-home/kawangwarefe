/**
 * Ask a treasurer/admin to void a receipt (T2.5, RR-6).
 *
 * Recorders cannot void or edit; they give a reason (≥ 10 characters) and a
 * treasurer or admin approves or rejects the request in the void inbox.
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
  REQUEST_RECEIPT_VOID,
  type RequestReceiptVoidData,
  type RequestReceiptVoidVars,
} from "@/lib/graphql/recorder-queries";
import { MIN_VOID_REASON_LENGTH } from "@/lib/receipts/format";

interface RequestVoidDialogProps {
  receiptNumber: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the request was accepted */
  onRequested?: (receiptNumber: string) => void;
}

export function RequestVoidDialog({ receiptNumber, open, onOpenChange, onRequested }: RequestVoidDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [requestVoid, { loading }] = useMutation<RequestReceiptVoidData, RequestReceiptVoidVars>(
    REQUEST_RECEIPT_VOID
  );

  const close = (next: boolean) => {
    if (!next) {
      setReason("");
      setError("");
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!receiptNumber || loading) return;
    const trimmed = reason.trim();
    if (trimmed.length < MIN_VOID_REASON_LENGTH) {
      setError(`Give a reason of at least ${MIN_VOID_REASON_LENGTH} characters.`);
      return;
    }
    setError("");
    try {
      const { data } = await requestVoid({ variables: { receiptNumber, reason: trimmed } });
      const result = data?.requestReceiptVoid;
      if (result?.success) {
        toast.success(result.message || `Void requested for receipt ${receiptNumber}`);
        onRequested?.(receiptNumber);
        close(false);
      } else {
        toast.error(result?.message || "Could not request the void");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request the void");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request void of {receiptNumber}</DialogTitle>
          <DialogDescription>
            A treasurer or admin will review the request. Until then the receipt
            stays valid. Record the corrected gift as a new entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="void-request-reason">Reason</Label>
          <Textarea
            id="void-request-reason"
            value={reason}
            rows={3}
            placeholder="e.g. Recorded 5,000 instead of 500"
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">At least {MIN_VOID_REASON_LENGTH} characters.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
