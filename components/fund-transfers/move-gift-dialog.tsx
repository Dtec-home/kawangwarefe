"use client";

/**
 * "Move gift…" — re-split one payment between departments/purposes (US-19, RA-2, E7).
 *
 * The target lines start as the payment's current lines; the running total
 * must equal the payment total (exact-total rule). "Preview" asks the server
 * what would be written (before/after); "Move gift" applies it with a reason.
 * Any change to the lines discards the preview. Treasurer/admin only — the
 * server refuses everyone else.
 */

import { useMemo, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DepartmentSelect,
  PurposeSelect,
  purposesVariables,
  type DepartmentOption,
  type PurposeOption,
} from "@/components/fund-transfers/fund-selects";
import { PREVIEW_PAYMENT_REALLOCATION, REALLOCATE_PAYMENT } from "@/lib/graphql/fund-transfers";
import { GET_GIVING_CATEGORIES, GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import {
  amountToCents,
  centsToAmount,
  formatCents,
  reallocationErrorMessage,
  sumTargets,
  validateMoveGift,
  type TargetDraft,
} from "@/lib/fund-transfers/logic";
import type { PaymentLine, ReallocationLine, ReallocationPreview, ReallocationTargetInput } from "@/lib/fund-transfers/types";
import { formatKes } from "@/lib/receipts/format";

interface Row extends TargetDraft {
  key: number;
  /** The current line's purpose name, used until the user picks a purpose. */
  purposeHint: string | null;
}

interface CategoriesData {
  contributionCategories: DepartmentOption[];
}

let nextKey = 1;
const rowsFrom = (lines: PaymentLine[]): Row[] =>
  lines.map((l) => ({
    key: nextKey++,
    departmentId: l.departmentId,
    purposeId: "",
    purposeHint: l.purposeName,
    amount: centsToAmount(amountToCents(l.amount) ?? 0),
  }));

function LinesTable({ title, lines }: { title: string; lines: ReallocationLine[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">{title}</h4>
      <table className="w-full text-sm">
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-1 pr-2">{l.purpose ? `${l.department} / ${l.purpose}` : l.department}</td>
              <td className="py-1 text-right tabular-nums">{formatKes(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MoveGiftDialog({
  open,
  onOpenChange,
  contributionGroupId,
  lines,
  onMoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributionGroupId: string;
  /** The payment's current lines (every contribution sharing the group id). */
  lines: PaymentLine[];
  onMoved: () => void;
}) {
  const client = useApolloClient();
  const paymentCents = useMemo(() => sumTargets(lines), [lines]);
  const [rows, setRows] = useState<Row[]>(() => rowsFrom(lines));
  const [loadedFor, setLoadedFor] = useState(contributionGroupId);
  const [preview, setPreview] = useState<ReallocationPreview | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [previewing, setPreviewing] = useState(false);

  // A different payment opened in the same dialog: start again from its lines.
  if (loadedFor !== contributionGroupId) {
    setLoadedFor(contributionGroupId);
    setRows(rowsFrom(lines));
    setPreview(null);
    setProblem(null);
    setReason("");
  }

  const { data: categoriesData } = useQuery<CategoriesData>(GET_GIVING_CATEGORIES, { skip: !open });
  const departments = categoriesData?.contributionCategories ?? [];
  const [reallocate, { loading: applying }] = useMutation(REALLOCATE_PAYMENT);

  const total = sumTargets(rows);
  const balanced = total === paymentCents;

  const change = (key: number, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setPreview(null);
    setProblem(null);
  };
  const addRow = () => {
    setRows((rs) => [
      ...rs,
      { key: nextKey++, departmentId: "", purposeId: "", purposeHint: null, amount: centsToAmount(Math.max(paymentCents - total, 0)) },
    ]);
    setPreview(null);
  };
  const removeRow = (key: number) => {
    setRows((rs) => rs.filter((r) => r.key !== key));
    setPreview(null);
    setProblem(null);
  };

  /** The purpose id a row stands for (its hint resolved through the cached purposes). */
  const purposeOf = (row: Row): string | null => {
    if (row.purposeId) return row.purposeId;
    if (!row.purposeHint || !row.departmentId) return null;
    const cached = client.readQuery<{ departmentPurposes: PurposeOption[] }>({
      query: GET_DEPARTMENT_PURPOSES,
      variables: purposesVariables(row.departmentId),
    });
    return cached?.departmentPurposes.find((p) => p.name === row.purposeHint)?.id ?? null;
  };

  const targets = (): ReallocationTargetInput[] =>
    rows.map((r) => ({ departmentId: r.departmentId, purposeId: purposeOf(r), amount: centsToAmount(amountToCents(r.amount) ?? 0) }));

  const close = (next: boolean) => {
    if (!next) {
      setRows(rowsFrom(lines));
      setPreview(null);
      setProblem(null);
      setReason("");
    }
    onOpenChange(next);
  };

  const runPreview = async () => {
    const invalid = validateMoveGift(rows, paymentCents);
    if (invalid) {
      setProblem(invalid);
      return;
    }
    setPreviewing(true);
    try {
      const { data } = await client.query({
        query: PREVIEW_PAYMENT_REALLOCATION,
        variables: { contributionGroupId, targets: targets() },
        fetchPolicy: "network-only",
      });
      const result = data?.previewPaymentReallocation;
      if (!result) {
        setProblem("Could not preview the move.");
      } else if (!result.ok) {
        setProblem(reallocationErrorMessage(result.code, result.message));
      } else {
        setPreview(result);
        setProblem(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not preview the move.";
      setProblem(message);
      toast.error(message);
    } finally {
      setPreviewing(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    if (!reason.trim()) {
      setProblem("Say why the gift is being moved.");
      return;
    }
    try {
      const { data } = await reallocate({
        variables: { contributionGroupId, targets: targets(), reason: reason.trim() },
      });
      const result = data?.reallocatePayment;
      if (!result?.ok) {
        const message = reallocationErrorMessage(result?.code, result?.message ?? "Could not move the gift.");
        setProblem(message);
        toast.error(message);
        return;
      }
      toast.success("Gift moved");
      onMoved();
      close(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move the gift.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Move gift</DialogTitle>
          <DialogDescription>
            Put this payment of {formatCents(paymentCents)} in the right department or purpose. The lines must add up to
            the payment total.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Move to</h4>
          {rows.map((row, index) => (
            <div key={row.key} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end" data-testid="move-gift-row">
              <DepartmentSelect
                id={`mg-dept-${row.key}`}
                label={`Department (line ${index + 1})`}
                value={row.departmentId}
                options={departments}
                onChange={(v) => change(row.key, { departmentId: v, purposeId: "", purposeHint: null })}
              />
              <PurposeSelect
                id={`mg-purpose-${row.key}`}
                label={`Purpose (line ${index + 1})`}
                departmentId={row.departmentId}
                value={row.purposeId}
                purposeHint={row.purposeHint}
                onChange={(v) => change(row.key, { purposeId: v, purposeHint: null })}
              />
              <div className="space-y-1.5">
                <Label htmlFor={`mg-amount-${row.key}`}>{`Amount (line ${index + 1})`}</Label>
                <Input
                  id={`mg-amount-${row.key}`}
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) => change(row.key, { amount: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove line ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() => removeRow(row.key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add line
            </Button>
            <p
              className={`text-sm font-medium ${balanced ? "text-success" : "text-destructive"}`}
              data-testid="move-gift-total"
              aria-live="polite"
            >
              {formatCents(total)} of {formatCents(paymentCents)}
              {!balanced && ` (${total > paymentCents ? "over" : "short"} by ${formatCents(Math.abs(paymentCents - total))})`}
            </p>
          </div>

          {preview && (
            <div className="grid gap-4 rounded-lg bg-muted p-3 sm:grid-cols-2" data-testid="move-gift-preview">
              <LinesTable title="Before" lines={preview.before} />
              <LinesTable title="After" lines={preview.after} />
            </div>
          )}

          {preview && (
            <div className="space-y-1.5">
              <Label htmlFor="mg-reason">Reason</Label>
              <Textarea
                id="mg-reason"
                rows={2}
                placeholder="e.g. Giver meant Building, not Tithe"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setProblem(null);
                }}
              />
            </div>
          )}

          {problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={applying}>
            Close
          </Button>
          <Button variant={preview ? "outline" : "default"} onClick={runPreview} disabled={previewing || applying}>
            {previewing ? "Checking…" : "Preview"}
          </Button>
          <Button onClick={apply} disabled={!preview || applying}>
            {applying ? "Moving…" : "Move gift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
