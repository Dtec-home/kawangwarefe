"use client";

/**
 * Period summary on the Treasurer's Cash Statement card (T4.1, T4.2; spec 03 §5):
 * the statement of local church funds and the remittances for the card's range.
 * Treasurer/admin may set the local fund opening balance and add, edit or
 * delete remittances; other staff (pastors) see it read-only.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { AlertCircle, Info, Pencil, Plus, Send, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  GET_PERIOD_SUMMARY,
  type LocalFundOpeningBalance,
  type LocalFundStatement,
  type PeriodSummaryData,
  type Remittance,
  type RemittanceSummary,
} from "@/lib/graphql/treasury-queries";
import {
  CREATE_REMITTANCE,
  DELETE_REMITTANCE,
  SET_LOCAL_FUND_OPENING_BALANCE,
  UPDATE_REMITTANCE,
  type CreateRemittanceData,
  type DeleteRemittanceData,
  type RemittanceInputVars,
  type SetLocalFundOpeningBalanceData,
  type SetLocalFundOpeningBalanceVars,
  type UpdateRemittanceData,
  type UpdateRemittanceVars,
} from "@/lib/graphql/treasury-mutations";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate, nairobiToday } from "@/lib/treasury/entry-dates";
import {
  REMITTANCE_METHODS,
  openingAmountError,
  remittanceAmountError,
  remittanceMethodLabel,
} from "@/lib/treasury/remittances";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

// ─── Opening balance dialog ────────────────────────────────────────────────

function OpeningBalanceDialog({
  open,
  onOpenChange,
  current,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: LocalFundOpeningBalance | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted only while open, so each opening starts from `current`. */}
        {open && <OpeningBalanceForm current={current} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function OpeningBalanceForm({
  current,
  onClose,
  onSaved,
}: {
  current: LocalFundOpeningBalance | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = nairobiToday();
  const [amount, setAmount] = useState(current?.amount ?? "");
  const [asOfDate, setAsOfDate] = useState(current?.asOfDate ?? today);
  const [note, setNote] = useState(current?.note ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [setOpening, { loading }] = useMutation<
    SetLocalFundOpeningBalanceData,
    SetLocalFundOpeningBalanceVars
  >(SET_LOCAL_FUND_OPENING_BALANCE);

  const amountError = openingAmountError(amount);
  const dateError = !asOfDate
    ? "Choose the as-of date"
    : asOfDate > today
      ? "The as-of date cannot be in the future"
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (amountError || dateError) return;
    try {
      const { data } = await setOpening({
        variables: { amount: amount.trim(), asOfDate, note: note.trim() },
      });
      const result = data?.setLocalFundOpeningBalance;
      if (result?.success) {
        toast.success(result.message || "Opening balance saved");
        onClose();
        onSaved();
      } else {
        toast.error(result?.message || "Could not save the opening balance");
      }
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the opening balance"));
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>Local fund opening balance</DialogTitle>
        <DialogDescription>
          The local church funds balance on the as-of date. Balances brought forward are
          computed from here. It may be negative if the fund was overdrawn.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="opening-amount">Amount (KES)</Label>
        <Input
          id="opening-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={submitted && !!amountError}
          aria-describedby="opening-amount-error"
        />
        <FieldError id="opening-amount-error" message={submitted ? amountError : null} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="opening-date">As of</Label>
        <Input
          id="opening-date"
          type="date"
          max={today}
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          aria-invalid={submitted && !!dateError}
          aria-describedby="opening-date-error"
        />
        <FieldError id="opening-date-error" message={submitted ? dateError : null} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="opening-note">Note (optional)</Label>
        <Textarea id="opening-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save opening balance"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Remittance dialog ─────────────────────────────────────────────────────

function RemittanceDialog({
  open,
  onOpenChange,
  editing,
  dateFrom,
  dateTo,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Remittance | null;
  dateFrom: string;
  dateTo: string;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted only while open, so each opening starts from `editing` or the card range. */}
        {open && (
          <RemittanceForm
            editing={editing}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function initialRemittanceForm(editing: Remittance | null, dateFrom: string, dateTo: string): RemittanceInputVars {
  if (editing) {
    return {
      periodFrom: editing.periodFrom,
      periodTo: editing.periodTo,
      method: editing.method,
      amount: editing.amount,
      remittedOn: editing.remittedOn,
      reference: editing.reference,
      note: editing.note,
    };
  }
  return {
    periodFrom: dateFrom,
    periodTo: dateTo,
    method: "",
    amount: "",
    remittedOn: nairobiToday(),
    reference: "",
    note: "",
  };
}

function RemittanceForm({
  editing,
  dateFrom,
  dateTo,
  onClose,
  onSaved,
}: {
  editing: Remittance | null;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<RemittanceInputVars>(() => initialRemittanceForm(editing, dateFrom, dateTo));
  const [submitted, setSubmitted] = useState(false);
  const [createRemittance, { loading: creating }] = useMutation<CreateRemittanceData, RemittanceInputVars>(
    CREATE_REMITTANCE,
  );
  const [updateRemittance, { loading: updating }] = useMutation<UpdateRemittanceData, UpdateRemittanceVars>(
    UPDATE_REMITTANCE,
  );

  const set = (field: keyof RemittanceInputVars) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const errors = {
    method: form.method ? null : "Choose a method",
    amount: remittanceAmountError(form.amount),
    period: !form.periodFrom || !form.periodTo
      ? "Choose the period"
      : form.periodTo < form.periodFrom
        ? "Period end must not be before period start"
        : null,
    remittedOn: form.remittedOn ? null : "Choose the date remitted",
  };
  const invalid = Object.values(errors).some(Boolean);
  const shown = (message: string | null) => (submitted ? message : null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    const variables: RemittanceInputVars = {
      ...form,
      amount: form.amount.trim(),
      reference: form.reference.trim(),
      note: form.note.trim(),
    };
    try {
      const result = editing
        ? (await updateRemittance({ variables: { id: editing.id, ...variables } })).data?.updateRemittance
        : (await createRemittance({ variables })).data?.createRemittance;
      if (result?.success) {
        toast.success(result.message || (editing ? "Remittance updated" : "Remittance recorded"));
        onClose();
        onSaved();
      } else {
        toast.error(result?.message || "Could not save the remittance");
      }
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the remittance"));
    }
  };

  const saving = creating || updating;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit remittance" : "Record remittance"}</DialogTitle>
        <DialogDescription>
          Money sent to the conference for the trust funds collected in a period.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="remittance-method">Method</Label>
          <Select name="Method" value={form.method} onValueChange={set("method")}>
            <SelectTrigger id="remittance-method" className="w-full">
              <SelectValue placeholder="Choose a method" />
            </SelectTrigger>
            <SelectContent>
              {REMITTANCE_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="remittance-method-error" message={shown(errors.method)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remittance-amount">Amount (KES)</Label>
          <Input
            id="remittance-amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => set("amount")(e.target.value)}
            aria-invalid={submitted && !!errors.amount}
            aria-describedby="remittance-amount-error"
          />
          <FieldError id="remittance-amount-error" message={shown(errors.amount)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remittance-reference">Reference</Label>
          <Input
            id="remittance-reference"
            value={form.reference}
            maxLength={100}
            onChange={(e) => set("reference")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remittance-remitted-on">Remitted on</Label>
          <Input
            id="remittance-remitted-on"
            type="date"
            value={form.remittedOn}
            onChange={(e) => set("remittedOn")(e.target.value)}
          />
          <FieldError id="remittance-remitted-on-error" message={shown(errors.remittedOn)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remittance-period-from">Period from</Label>
          <Input
            id="remittance-period-from"
            type="date"
            value={form.periodFrom}
            onChange={(e) => set("periodFrom")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remittance-period-to">Period to</Label>
          <Input
            id="remittance-period-to"
            type="date"
            value={form.periodTo}
            onChange={(e) => set("periodTo")(e.target.value)}
          />
        </div>
      </div>
      <FieldError id="remittance-period-error" message={shown(errors.period)} />
      <div className="space-y-2">
        <Label htmlFor="remittance-note">Note (optional)</Label>
        <Textarea id="remittance-note" rows={2} value={form.note} onChange={(e) => set("note")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "Record remittance"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────

function StatementRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? "font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function LocalFundSection({
  statement,
  opening,
  canManage,
  onSetOpening,
}: {
  statement: LocalFundStatement;
  opening: LocalFundOpeningBalance | null;
  canManage: boolean;
  onSetOpening: () => void;
}) {
  return (
    <section aria-labelledby="local-fund-heading" className="space-y-3">
      <h3 id="local-fund-heading" className="text-sm font-semibold">
        Local church funds
      </h3>

      {opening ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span data-testid="local-fund-opening">
            Opening balance {formatKes(opening.amount)} as of {formatEntryDate(opening.asOfDate)}
          </span>
          {canManage && (
            <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs" onClick={onSetOpening}>
              Change
            </Button>
          )}
        </div>
      ) : canManage ? (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertTitle>No opening balance yet</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Set the local fund opening balance so the balance brought forward can be computed.</p>
            <Button type="button" size="sm" variant="outline" onClick={onSetOpening}>
              Set local fund opening balance
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-xs text-muted-foreground">
          No local fund opening balance has been set. The treasurer can set one.
        </p>
      )}

      <dl className="divide-y rounded-lg border px-4 text-sm" data-testid="local-fund-statement">
        <StatementRow
          label="Balance brought forward"
          value={statement.balanceBroughtForward === null ? "—" : formatKes(statement.balanceBroughtForward)}
        />
        <StatementRow label="Received" value={formatKes(statement.received)} />
        <StatementRow label="Total" value={formatKes(statement.total)} strong />
        <StatementRow label="Less payments" value={formatKes(statement.lessPayment)} />
        <StatementRow label="Balance at end" value={formatKes(statement.balanceEnd)} strong />
      </dl>
      {statement.note && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {statement.note}
        </p>
      )}
    </section>
  );
}

function RemittancesSection({
  remittances,
  summary,
  canManage,
  onAdd,
  onEdit,
  onDelete,
}: {
  remittances: Remittance[];
  summary: RemittanceSummary;
  canManage: boolean;
  onAdd: () => void;
  onEdit: (remittance: Remittance) => void;
  onDelete: (remittance: Remittance) => void;
}) {
  return (
    <section aria-labelledby="remittances-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="remittances-heading" className="text-sm font-semibold">
          Remittances for this period
        </h3>
        {canManage && (
          <Button type="button" size="sm" variant="outline" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add remittance
          </Button>
        )}
      </div>

      {remittances.length === 0 ? (
        <Empty
          icon={Send}
          title="No remittances"
          description="No remittance has been recorded for a period overlapping these dates."
          className="py-6"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Remitted on</TableHead>
                {canManage && <TableHead className="sr-only">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {remittances.map((r) => (
                <TableRow key={r.id} data-testid={`remittance-row-${r.id}`}>
                  <TableCell>{r.methodLabel || remittanceMethodLabel(r.method)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatKes(r.amount)}</TableCell>
                  <TableCell>{r.reference || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{formatEntryDate(r.remittedOn)}</TableCell>
                  {canManage && (
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit remittance ${r.reference || r.id}`}
                        onClick={() => onEdit(r)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete remittance ${r.reference || r.id}`}
                        onClick={() => onDelete(r)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid="remittance-totals">
        {REMITTANCE_METHODS.map((m) => (
          <div key={m.value} className="rounded-lg bg-muted/50 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{m.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{formatKes(summary[m.summaryKey])}</dd>
          </div>
        ))}
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Total remitted</dt>
          <dd className="text-sm font-semibold tabular-nums" data-testid="remittance-total">
            {formatKes(summary.total)}
          </dd>
        </div>
      </dl>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        The exported summary page compares this with the statement&apos;s trust fund total and flags any
        mismatch.
      </p>
    </section>
  );
}

// ─── Period summary ────────────────────────────────────────────────────────

export interface PeriodSummaryProps {
  dateFrom: string;
  dateTo: string;
  /** Bumped by the card after a statement is generated, to refetch. */
  refreshKey?: number;
}

export function PeriodSummary({ dateFrom, dateTo, refreshKey = 0 }: PeriodSummaryProps) {
  const { canManageBooks, loading: roleLoading } = useUserRole();
  const { data, loading, error, refetch } = useQuery<PeriodSummaryData>(GET_PERIOD_SUMMARY, {
    variables: { dateFrom, dateTo },
    fetchPolicy: "cache-and-network",
  });
  const [openingOpen, setOpeningOpen] = useState(false);
  const [remittanceOpen, setRemittanceOpen] = useState(false);
  const [editing, setEditing] = useState<Remittance | null>(null);
  const [deleting, setDeleting] = useState<Remittance | null>(null);
  const [deleteRemittance, { loading: deletingInFlight }] = useMutation<DeleteRemittanceData, { id: string }>(
    DELETE_REMITTANCE,
  );

  useEffect(() => {
    if (refreshKey > 0) void refetch();
  }, [refreshKey, refetch]);

  const reload = () => {
    void refetch();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { data: result } = await deleteRemittance({ variables: { id: deleting.id } });
      if (result?.deleteRemittance.success) {
        toast.success(result.deleteRemittance.message || "Remittance deleted");
        reload();
      } else {
        toast.error(result?.deleteRemittance.message || "Could not delete the remittance");
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the remittance"));
    } finally {
      setDeleting(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-3" data-testid="period-summary-loading">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load the period summary</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data?.localFundStatement || !data.remittanceSummary) return null;

  return (
    <div className="space-y-6" data-testid="period-summary">
      {!roleLoading && !canManageBooks && (
        <p className="text-xs text-muted-foreground">
          Read-only: only the treasurer or an admin can change the opening balance or remittances.
        </p>
      )}
      <LocalFundSection
        statement={data.localFundStatement}
        opening={data.localFundOpeningBalance}
        canManage={canManageBooks}
        onSetOpening={() => setOpeningOpen(true)}
      />
      <RemittancesSection
        remittances={data.remittances ?? []}
        summary={data.remittanceSummary}
        canManage={canManageBooks}
        onAdd={() => {
          setEditing(null);
          setRemittanceOpen(true);
        }}
        onEdit={(r) => {
          setEditing(r);
          setRemittanceOpen(true);
        }}
        onDelete={setDeleting}
      />

      {canManageBooks && (
        <>
          <OpeningBalanceDialog
            open={openingOpen}
            onOpenChange={setOpeningOpen}
            current={data.localFundOpeningBalance}
            onSaved={reload}
          />
          <RemittanceDialog
            open={remittanceOpen}
            onOpenChange={setRemittanceOpen}
            editing={editing}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSaved={reload}
          />
          <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this remittance?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleting
                    ? `${remittanceMethodLabel(deleting.method)} remittance of ${formatKes(deleting.amount)} remitted on ${formatEntryDate(deleting.remittedOn)}. `
                    : ""}
                  This cannot be undone; the audit log keeps a copy.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deletingInFlight}
                  onClick={() => void handleDelete()}
                >
                  Delete remittance
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
