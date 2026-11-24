"use client";

/**
 * "Move money between funds" — request a fund transfer (US-16, E5, E6).
 *
 * The available balance of the source (department, or purpose when chosen) on
 * the transfer date is read live from `fundAvailableBalance` and re-read on
 * every change. Validation mirrors FundTransferService.request; the server
 * re-checks everything and its FundTransferError codes are shown in plain words.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DepartmentSelect, PurposeSelect, type DepartmentOption } from "@/components/fund-transfers/fund-selects";
import { GET_FUND_AVAILABLE_BALANCE, REQUEST_FUND_TRANSFER } from "@/lib/graphql/fund-transfers";
import {
  isFundTransferError,
  transferErrorMessage,
  validateTransfer,
  type TransferDraft,
} from "@/lib/fund-transfers/logic";
import { formatKes } from "@/lib/receipts/format";
import { nairobiToday } from "@/lib/treasury/entry-dates";

const emptyDraft = (): TransferDraft => ({
  fromDepartmentId: "",
  fromPurposeId: "",
  toDepartmentId: "",
  toPurposeId: "",
  amount: "",
  transferDate: nairobiToday(),
  reason: "",
});

export function NewTransferDialog({
  open,
  onOpenChange,
  fromOptions,
  toOptions,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Departments the user may move money out of. */
  fromOptions: DepartmentOption[];
  toOptions: DepartmentOption[];
  onRequested: () => void;
}) {
  const [draft, setDraft] = useState<TransferDraft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (patch: Partial<TransferDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setFormError(null);
  };

  const balance = useQuery(GET_FUND_AVAILABLE_BALANCE, {
    variables: {
      departmentId: draft.fromDepartmentId,
      purposeId: draft.fromPurposeId || null,
      onDate: draft.transferDate || null,
    },
    skip: !open || !draft.fromDepartmentId,
    fetchPolicy: "network-only",
  });
  const available = draft.fromDepartmentId ? (balance.data?.fundAvailableBalance ?? null) : null;

  const [requestTransfer, { loading }] = useMutation(REQUEST_FUND_TRANSFER);

  const close = (next: boolean) => {
    if (!next) {
      setDraft(emptyDraft());
      setFormError(null);
    }
    onOpenChange(next);
  };

  const submit = async () => {
    const problem = validateTransfer(draft, available);
    if (problem) {
      setFormError(problem);
      return;
    }
    try {
      const { data } = await requestTransfer({
        variables: {
          input: {
            fromDepartmentId: draft.fromDepartmentId,
            fromPurposeId: draft.fromPurposeId || null,
            toDepartmentId: draft.toDepartmentId,
            toPurposeId: draft.toPurposeId || null,
            amount: draft.amount.replace(/,/g, "").trim(),
            transferDate: draft.transferDate,
            reason: draft.reason.trim(),
          },
        },
      });
      const result = data?.requestFundTransfer;
      if (!result || isFundTransferError(result)) {
        const message = result ? transferErrorMessage(result.code, result.message) : "Could not request the transfer.";
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success("Transfer requested. Another treasurer or admin must approve it.");
      onRequested();
      close(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request the transfer.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move money between funds</DialogTitle>
          <DialogDescription>
            The money moves on the books once another treasurer or admin approves the request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DepartmentSelect
              id="ft-from-department"
              label="From department"
              value={draft.fromDepartmentId}
              options={fromOptions}
              onChange={(v) => set({ fromDepartmentId: v, fromPurposeId: "" })}
            />
            <PurposeSelect
              id="ft-from-purpose"
              label="From purpose"
              departmentId={draft.fromDepartmentId}
              value={draft.fromPurposeId}
              onChange={(v) => set({ fromPurposeId: v })}
            />
          </div>
          <p className="text-sm text-muted-foreground" data-testid="ft-available" aria-live="polite">
            {!draft.fromDepartmentId
              ? "Choose where the money comes from to see what is available."
              : balance.error
                ? balance.error.message
                : available === null
                  ? "Checking the balance…"
                  : <>Available: <span className="font-semibold text-foreground">{formatKes(available)}</span></>}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <DepartmentSelect
              id="ft-to-department"
              label="To department"
              value={draft.toDepartmentId}
              options={toOptions}
              onChange={(v) => set({ toDepartmentId: v, toPurposeId: "" })}
            />
            <PurposeSelect
              id="ft-to-purpose"
              label="To purpose"
              departmentId={draft.toDepartmentId}
              value={draft.toPurposeId}
              onChange={(v) => set({ toPurposeId: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ft-amount">Amount</Label>
              <Input
                id="ft-amount"
                inputMode="decimal"
                placeholder="e.g. 5000"
                value={draft.amount}
                onChange={(e) => set({ amount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-date">Date</Label>
              <Input
                id="ft-date"
                type="date"
                value={draft.transferDate}
                onChange={(e) => set({ transferDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ft-reason">Reason</Label>
            <Textarea
              id="ft-reason"
              rows={3}
              placeholder="Why is the money being moved?"
              value={draft.reason}
              onChange={(e) => set({ reason: e.target.value })}
            />
          </div>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={loading}>
            Close
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Sending…" : "Request transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
