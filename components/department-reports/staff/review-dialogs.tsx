"use client";

/**
 * "Approve report?" (US-9) and "Reopen report?" (US-13, admin, reason
 * required) confirmation dialogs (DR-8).
 */

import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

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

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting?: boolean;
  departmentName: string;
}

export function ApproveDialog({
  open,
  onOpenChange,
  submitting = false,
  departmentName,
  onConfirm,
}: BaseProps & { onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve report?</DialogTitle>
          <DialogDescription>
            The {departmentName} report will be locked and filed for the AGM book. Only an admin can reopen it
            later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const REOPEN_REASON_MAX_CHARS = 500;

export function ReopenDialog({
  open,
  onOpenChange,
  submitting = false,
  departmentName,
  onConfirm,
}: BaseProps & { onConfirm: (reason: string) => Promise<boolean> }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = reason.trim();
  const error = touched && !trimmed ? "Give a reason for reopening the report." : null;

  const close = (next: boolean) => {
    if (!next) {
      setReason("");
      setTouched(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!trimmed || submitting) return;
    if (await onConfirm(trimmed)) {
      setReason("");
      setTouched(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reopen report?</DialogTitle>
          <DialogDescription>
            The {departmentName} report goes back to draft so it can be corrected. The money figures are frozen
            again when it is next submitted. Your reason is kept in the audit log.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="reopen-reason">Reason for reopening</Label>
            <Textarea
              id="reopen-reason"
              rows={3}
              required
              maxLength={REOPEN_REASON_MAX_CHARS}
              placeholder="The money out figure missed the March roof invoice."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!error}
              aria-describedby={error ? "reopen-reason-error" : undefined}
            />
            {error ? (
              <p id="reopen-reason-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Reopen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
