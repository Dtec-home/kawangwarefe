/**
 * Close & count a collection session (T5.3, PRD CS-2).
 *
 * The recorder enters the counted cash and, optionally, how many of each note
 * and coin. Any breakdown must add up to the counted cash; a counted total
 * that differs from the recorded total needs a reason (≥ 10 characters).
 * The backend applies the same rules.
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CLOSE_COLLECTION_SESSION,
  type CloseCollectionSessionData,
  type CloseCollectionSessionVars,
  type CollectionSession,
} from "@/lib/graphql/collection-session-queries";
import {
  DENOMINATIONS,
  MIN_VARIANCE_REASON_LENGTH,
  breakdownEntries,
  centsToAmount,
  checkCloseSession,
  formatCents,
  toCents,
  type BreakdownCounts,
} from "@/lib/treasury/collection-sessions";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import { formatKes } from "@/lib/receipts/format";
import { cn } from "@/lib/utils";

interface CloseSessionDialogProps {
  session: CollectionSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed?: () => void;
}

export function CloseSessionDialog({ session, open, onOpenChange, onClosed }: CloseSessionDialogProps) {
  const [countedCash, setCountedCash] = useState("");
  const [counts, setCounts] = useState<BreakdownCounts>({});
  const [varianceReason, setVarianceReason] = useState("");
  const [attempted, setAttempted] = useState(false);

  const [closeSession, { loading }] = useMutation<CloseCollectionSessionData, CloseCollectionSessionVars>(
    CLOSE_COLLECTION_SESSION
  );

  const check = checkCloseSession({ countedCash, counts, varianceReason, recordedTotal: session.recordedTotal });
  const { errors, varianceCents, breakdownCents, hasBreakdown } = check;
  const showErrors = attempted;
  const needsReason = varianceCents !== null && varianceCents !== 0;

  const reset = () => {
    setCountedCash("");
    setCounts({});
    setVarianceReason("");
    setAttempted(false);
  };

  const changeOpen = (next: boolean) => {
    if (loading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    const counted = toCents(countedCash)!;
    try {
      const { data } = await closeSession({
        variables: {
          id: session.id,
          countedCash: centsToAmount(counted),
          countedBreakdown: hasBreakdown ? breakdownEntries(counts) : null,
          varianceReason: needsReason ? varianceReason.trim() : null,
        },
      });
      const result = data?.closeCollectionSession;
      if (result?.success) {
        toast.success(result.message || "Collection session closed");
        reset();
        onOpenChange(false);
        onClosed?.();
      } else {
        toast.error(result?.message || "Could not close the session");
      }
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Could not close the session");
    }
  };

  const applyBreakdownTotal = () => setCountedCash(centsToAmount(breakdownCents));

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:max-w-full max-sm:rounded-b-none max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <DialogHeader>
          <DialogTitle>Close &amp; count</DialogTitle>
          <DialogDescription>
            {session.name} · {formatEntryDate(session.date)}. Count the cash before handing it over.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5" noValidate aria-label="Close and count">
          <div className="flex justify-between gap-3 rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">
              Recorded ({session.receiptCount} {session.receiptCount === 1 ? "receipt" : "receipts"})
            </span>
            <span className="font-semibold tabular-nums" data-testid="close-recorded-total">
              {formatKes(session.recordedTotal)}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="counted-cash">Counted cash (KES)</Label>
            <Input
              id="counted-cash"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              aria-invalid={showErrors && !!errors.countedCash}
              aria-describedby={showErrors && errors.countedCash ? "counted-cash-error" : undefined}
              className="h-11 text-base"
            />
            {showErrors && errors.countedCash && (
              <p id="counted-cash-error" className="text-sm text-destructive">
                {errors.countedCash}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Notes &amp; coins <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {DENOMINATIONS.map((denomination) => (
                <div key={denomination} className="flex items-center gap-2">
                  <Label htmlFor={`denomination-${denomination}`} className="w-20 shrink-0 text-sm tabular-nums">
                    KES {Number(denomination).toLocaleString("en-KE")}
                  </Label>
                  <Input
                    id={`denomination-${denomination}`}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    value={counts[denomination] ?? ""}
                    onChange={(e) => setCounts((prev) => ({ ...prev, [denomination]: e.target.value }))}
                    className="h-10"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                Breakdown total:{" "}
                <span className="font-semibold tabular-nums" data-testid="breakdown-total">
                  KES {formatCents(breakdownCents)}
                </span>
              </span>
              {hasBreakdown && toCents(countedCash) !== breakdownCents && (
                <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={applyBreakdownTotal}>
                  Use as counted cash
                </Button>
              )}
            </div>
            {errors.breakdown && (showErrors || (hasBreakdown && toCents(countedCash) !== null)) && (
              <p className="text-sm text-destructive" role="alert" data-testid="breakdown-error">
                {errors.breakdown}
              </p>
            )}
          </fieldset>

          {varianceCents !== null && (
            <div
              className={cn(
                "flex justify-between gap-3 rounded-lg border p-3 text-sm",
                varianceCents === 0
                  ? "border-success/30 bg-success/10"
                  : varianceCents < 0
                    ? "border-destructive/30 bg-destructive/10"
                    : "border-warning/40 bg-warning/10"
              )}
              data-testid="close-variance"
            >
              <span>
                {varianceCents === 0 ? "Balanced" : varianceCents < 0 ? "Cash short" : "Cash over"}
              </span>
              <span className="font-semibold tabular-nums">
                Variance {varianceCents > 0 ? "+" : varianceCents < 0 ? "−" : ""}KES {formatCents(Math.abs(varianceCents))}
              </span>
            </div>
          )}

          {needsReason && (
            <div className="space-y-1.5">
              <Label htmlFor="variance-reason">Reason for the difference</Label>
              <Textarea
                id="variance-reason"
                rows={3}
                placeholder="e.g. KES 200 given as change to a visitor"
                value={varianceReason}
                onChange={(e) => setVarianceReason(e.target.value)}
                aria-invalid={showErrors && !!errors.varianceReason}
                aria-describedby="variance-reason-help"
              />
              <p
                id="variance-reason-help"
                className={cn("text-xs", showErrors && errors.varianceReason ? "text-destructive" : "text-muted-foreground")}
              >
                {showErrors && errors.varianceReason
                  ? errors.varianceReason
                  : `Required when the count differs (at least ${MIN_VARIANCE_REASON_LENGTH} characters).`}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="mobile" onClick={() => changeOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="mobile" disabled={loading} aria-busy={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Close session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
