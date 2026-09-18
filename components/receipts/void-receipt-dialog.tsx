/**
 * Void a receipt (T1.5 / T1.8, RC-6, D6).
 *
 * Shown only to treasurers and admins (`canVoidReceipts`). A reason of at
 * least 10 characters is required; the backend re-checks the permission and
 * the reason, and audit-logs the void.
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
  VOID_RECEIPT,
  type VoidReceiptData,
  type VoidReceiptVars,
} from "@/lib/graphql/receipt-queries";
import { MIN_VOID_REASON_LENGTH } from "@/lib/receipts/format";

interface VoidReceiptDialogProps {
  receipt: { id: string; number: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful void (e.g. to refetch) */
  onVoided?: () => void;
}

export function VoidReceiptDialog({ receipt, open, onOpenChange, onVoided }: VoidReceiptDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [voidReceipt, { loading }] = useMutation<VoidReceiptData, VoidReceiptVars>(VOID_RECEIPT, {
    refetchQueries: ["GetPendingVoidRequestCount"],
  });

  const close = (next: boolean) => {
    if (!next) {
      setReason("");
      setError("");
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!receipt) return;
    const trimmed = reason.trim();
    if (trimmed.length < MIN_VOID_REASON_LENGTH) {
      setError(`Give a reason of at least ${MIN_VOID_REASON_LENGTH} characters.`);
      return;
    }
    setError("");
    try {
      const { data } = await voidReceipt({ variables: { receiptId: receipt.id, reason: trimmed } });
      const result = data?.voidReceipt;
      if (result?.success) {
        toast.success(result.message || `Receipt ${receipt.number} voided`);
        onVoided?.();
        close(false);
      } else {
        toast.error(result?.message || "Could not void the receipt");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not void the receipt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void receipt {receipt?.number}</DialogTitle>
          <DialogDescription>
            A voided receipt keeps its number, shows as VOID and is left out of
            totals. This cannot be undone. Record the corrected gift as a new entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="void-reason">Reason</Label>
          <Textarea
            id="void-reason"
            value={reason}
            rows={3}
            placeholder="e.g. Amount entered as 5,000 instead of 500"
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least {MIN_VOID_REASON_LENGTH} characters. Saved in the audit log.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Void receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
