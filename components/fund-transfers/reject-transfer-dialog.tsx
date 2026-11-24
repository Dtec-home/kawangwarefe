"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** "Reject transfer?" — the note is required (FundTransferService.reject). */
export function RejectTransferDialog({
  open,
  summary,
  busy,
  onOpenChange,
  onReject,
}: {
  open: boolean;
  summary: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = (next: boolean) => {
    if (!next) {
      setNote("");
      setError(null);
    }
    onOpenChange(next);
  };

  const submit = () => {
    if (!note.trim()) {
      setError("Say why the transfer is rejected.");
      return;
    }
    onReject(note.trim());
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject transfer?</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="ft-reject-note">Note</Label>
          <Textarea
            id="ft-reject-note"
            rows={3}
            value={note}
            placeholder="Tell the requester why"
            onChange={(e) => {
              setNote(e.target.value);
              setError(null);
            }}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {busy ? "Rejecting…" : "Reject transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
