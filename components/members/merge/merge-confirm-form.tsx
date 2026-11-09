/**
 * MergeConfirmForm (MG-2, M1): one admin merges, so the form asks for a
 * reason and the survivor's full name typed out before "Merge" enables.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sameName } from "./types";

export function MergeConfirmForm({
  survivorName,
  onConfirm,
  disabled = false,
  busy = false,
}: {
  survivorName: string;
  onConfirm: (reason: string, confirmName: string) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const name = survivorName.trim();
  const ready = !disabled && !busy && reason.trim() !== "" && sameName(typed, name);
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (ready) onConfirm(reason.trim(), typed); }}>
      <div className="space-y-1">
        <Label htmlFor="merge-reason">Reason</Label>
        <Textarea id="merge-reason" value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Same person: second line, confirmed by phone" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="merge-confirm-name">Type {name} to confirm</Label>
        <Input id="merge-confirm-name" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="destructive" disabled={!ready}>{busy ? "Merging..." : "Merge"}</Button>
      </div>
    </form>
  );
}
