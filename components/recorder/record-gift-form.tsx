/**
 * Record one giver's gift (T2.5, RR-3): giver → lines → entry type →
 * confirmation sheet → receipt number.
 *
 * The entry type is owned by the workspace so it survives "Next giver".
 * Dates: no date field; a "Recording for" selector appears only while an
 * admin catch-up window is open (T2.8, D13). Submission is guarded against
 * double taps (button disabled + in-flight ref) and carries an idempotency key
 * (T5.3): a retry after a network error reuses it, so the gift is recorded once.
 */

"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CheckCircle2, Loader2, MessageSquare, Printer, RotateCw, UserCheck, UserPlus, UserRoundPlus, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContributionLinesForm,
  contributionLinesTotal,
  emptyContributionLine,
  toManualCategoryInputs,
  validateContributionLines,
  type CategoryAmount,
} from "@/components/contributions/contribution-lines-form";
import {
  GiverIdentityFields,
  useGiverLookup,
  type GiverLookupResult,
} from "@/components/contributions/giver-lookup";
import {
  RECORD_FOR_TODAY,
  RecordingForField,
  effectiveRecordFor,
  recordForLabel,
  transactionDateVariables,
} from "@/components/contributions/recording-for-field";
import { useIdempotencyKey } from "@/components/contributions/idempotency";
import { CREATE_MANUAL_MULTI_CONTRIBUTION } from "@/lib/graphql/manual-contribution-mutations";
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import { formatKes, receiptHref } from "@/lib/receipts/format";
import { cn } from "@/lib/utils";

export type RecorderEntryType = "cash" | "envelope";

export const RECORDER_ENTRY_TYPES: { value: RecorderEntryType; label: string; hint: string }[] = [
  { value: "cash", label: "Cash", hint: "Loose money / local evangelism" },
  { value: "envelope", label: "Envelope", hint: "Tithe & offering envelope" },
];

interface CreateMultiContributionResult {
  createManualMultiContribution: {
    success: boolean;
    message: string;
    receiptNumber?: string | null;
    totalAmount?: string | null;
    smsSent?: boolean;
    idempotentReplay?: boolean;
  };
}

interface IssuedReceipt {
  receiptNumber: string | null;
  total: number;
  giver: string;
  walkIn: boolean;
  smsSent: boolean;
}

interface RecordGiftFormProps {
  entryType: RecorderEntryType;
  onEntryTypeChange: (entryType: RecorderEntryType) => void;
  unlockDates: string[];
  hasActiveUnlocks: boolean;
  /** Pure recorders get the giver's name only; no identifier prefill */
  nameOnly: boolean;
  /** Called after a receipt was issued (e.g. refetch today's entries) */
  onRecorded?: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
}

function PurposeName({ categoryId, purposeId }: { categoryId: string; purposeId: string }) {
  const { data } = useQuery<{ departmentPurposes: { id: string; name: string }[] }>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId, isActive: true },
    fetchPolicy: "cache-first",
  });
  const name = data?.departmentPurposes?.find((p) => p.id === purposeId)?.name;
  return name ? <span className="block text-xs text-muted-foreground">{name}</span> : null;
}

export function RecordGiftForm({
  entryType,
  onEntryTypeChange,
  unlockDates,
  hasActiveUnlocks,
  nameOnly,
  onRecorded,
}: RecordGiftFormProps) {
  const [walkIn, setWalkIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [giverName, setGiverName] = useState("");
  const [giver, setGiver] = useState<GiverLookupResult | null>(null);
  const [lines, setLines] = useState<CategoryAmount[]>([emptyContributionLine()]);
  const [recordFor, setRecordFor] = useState(RECORD_FOR_TODAY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedLines, setConfirmedLines] = useState<CategoryAmount[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState<IssuedReceipt | null>(null);
  /** The last attempt failed without an answer from the server: offer a retry */
  const [retryable, setRetryable] = useState(false);
  const inFlight = useRef(false);
  const idempotency = useIdempotencyKey();

  const { lookup, loading: lookupLoading } = useGiverLookup();
  const [createContribution] = useMutation<CreateMultiContributionResult>(CREATE_MANUAL_MULTI_CONTRIBUTION);
  const { data: categoryData } = useQuery<{ contributionCategories: CategoryOption[] }>(
    GET_CONTRIBUTION_CATEGORIES
  );

  const recordingFor = hasActiveUnlocks ? effectiveRecordFor(recordFor, unlockDates) : RECORD_FOR_TODAY;
  const total = contributionLinesTotal(lines);

  const runLookup = async (): Promise<GiverLookupResult | null> => {
    if (!phoneNumber.trim()) return null;
    try {
      const result = await lookup(phoneNumber);
      setGiver(result);
      return result;
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Could not look up the phone number");
      return null;
    }
  };

  const changeWalkIn = (next: boolean) => {
    setWalkIn(next);
    if (next) {
      setPhoneNumber("");
      setGiver(null);
    } else {
      setGiverName("");
    }
  };

  const changePhone = (phone: string) => {
    setPhoneNumber(phone);
    // A previous lookup no longer matches the typed number.
    setGiver(null);
  };

  const giverLabel = walkIn ? giverName.trim() : giver?.displayName || phoneNumber.trim();

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walkIn) {
      if (!giverName.trim()) {
        toast.error("Enter the walk-in giver's name");
        return;
      }
    } else {
      if (!phoneNumber.trim()) {
        toast.error("Enter the giver's phone number, or choose walk-in");
        return;
      }
      if (!giver) {
        const result = await runLookup();
        if (!result) return;
      }
    }
    const validation = validateContributionLines(lines);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    setConfirmedLines(validation.lines);
    setRetryable(false);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    // Ignore double taps: the ref flips synchronously, before any re-render.
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    const submission = {
      contributions: toManualCategoryInputs(confirmedLines),
      phoneNumber: walkIn ? null : phoneNumber.trim(),
      giverName: walkIn ? giverName.trim() : null,
      entryType,
      ...transactionDateVariables(recordingFor),
    };
    try {
      const { data } = await createContribution({
        variables: { ...submission, idempotencyKey: idempotency.keyFor(submission) },
      });
      const result = data?.createManualMultiContribution;
      // The server answered: this submission is settled either way.
      idempotency.settle();
      setRetryable(false);
      if (result?.success) {
        const number = result.receiptNumber ?? null;
        const replay = !!result.idempotentReplay;
        const replayTotal = Number.parseFloat(result.totalAmount ?? "");
        setIssued({
          receiptNumber: number,
          total: replay && Number.isFinite(replayTotal) ? replayTotal : contributionLinesTotal(confirmedLines),
          giver: giverLabel,
          walkIn,
          smsSent: !!result.smsSent,
        });
        setConfirmOpen(false);
        if (replay) {
          toast.info("Already recorded", {
            description: number ? `Showing the original receipt ${number}.` : "Showing the original entry.",
          });
        } else {
          toast.success(number ? `Receipt ${number} issued` : "Gift recorded");
        }
        onRecorded?.();
      } else {
        toast.error(result?.message || "Could not record the gift");
      }
    } catch (err) {
      // No answer (e.g. network error): the gift may or may not be saved. Keep
      // the key so a retry cannot record it twice.
      setRetryable(true);
      toast.error((err instanceof Error && err.message) || "Could not record the gift");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const nextGiver = () => {
    setIssued(null);
    setWalkIn(false);
    setPhoneNumber("");
    setGiverName("");
    setGiver(null);
    setLines([emptyContributionLine()]);
    setConfirmedLines([]);
  };

  const categoryName = (id: string) =>
    categoryData?.contributionCategories?.find((c) => c.id === id)?.name ?? "Department";
  const entryTypeLabel = RECORDER_ENTRY_TYPES.find((t) => t.value === entryType)?.label ?? entryType;

  if (issued) {
    return (
      <Card className="animate-in fade-in" data-testid="record-success">
        <CardContent className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success/12">
            <CheckCircle2 className="size-8 text-success" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Receipt number</p>
            <p
              className="font-mono text-3xl font-bold tracking-tight sm:text-4xl break-all"
              data-testid="issued-receipt-number"
            >
              {issued.receiptNumber ?? "—"}
            </p>
            <p className="text-sm">
              {formatKes(issued.total)} from <span className="font-medium">{issued.giver}</span>
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="sms-status">
            <MessageSquare className="h-4 w-4 shrink-0" />
            {issued.walkIn
              ? "Walk-in: no SMS sent"
              : issued.smsSent
                ? "SMS receipt sent to the giver"
                : "No SMS was sent. Use Resend SMS in Today's entries."}
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {issued.receiptNumber && (
              <Button asChild variant="outline" size="mobile" className="w-full">
                <a href={receiptHref(issued.receiptNumber)} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4 mr-2" />
                  Print receipt
                </a>
              </Button>
            )}
            <Button size="mobile" className="w-full" onClick={nextGiver} autoFocus>
              <UserRoundPlus className="h-4 w-4 mr-2" />
              Next giver
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <form onSubmit={handleReview} className="space-y-4" aria-label="Record a gift">
        {/* 1. Giver */}
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-base font-semibold">Giver</h2>
            <GiverIdentityFields
              walkIn={walkIn}
              onWalkInChange={changeWalkIn}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={changePhone}
              giverName={giverName}
              onGiverNameChange={setGiverName}
              onLookup={runLookup}
              lookupLoading={lookupLoading}
            >
              {lookupLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Looking up…
                </p>
              )}
              {!lookupLoading && giver?.found && giver.displayName && (
                <div
                  className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3"
                  data-testid="giver-found"
                >
                  <UserCheck className="h-5 w-5 shrink-0 text-success" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Confirm the name with the giver</p>
                    <p className="truncate text-base font-semibold">{giver.displayName}</p>
                  </div>
                </div>
              )}
              {!lookupLoading && giver && !giver.found && (
                <div className="flex items-center gap-3 rounded-lg border p-3" data-testid="giver-new">
                  <UserPlus className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <p className="text-sm">
                    This number is not registered. A new giver record will be created.
                  </p>
                </div>
              )}
            </GiverIdentityFields>
          </CardContent>
        </Card>

        {/* 2. Lines */}
        <Card>
          <CardContent className="space-y-3">
            <ContributionLinesForm
              lines={lines}
              onChange={setLines}
              phoneNumber={walkIn || nameOnly ? undefined : phoneNumber}
              label="Departments & amounts"
              showTotal
            />
          </CardContent>
        </Card>

        {/* 3. Entry type + 4. date */}
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p id="entry-type-label" className="text-sm font-medium">
                Entry type
              </p>
              <div role="radiogroup" aria-labelledby="entry-type-label" className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                {RECORDER_ENTRY_TYPES.map((type) => {
                  const selected = entryType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onEntryTypeChange(type.value)}
                      className={cn(
                        "min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {RECORDER_ENTRY_TYPES.find((t) => t.value === entryType)?.hint}
              </p>
            </div>
            <RecordingForField
              value={recordingFor}
              onChange={setRecordFor}
              unlockDates={unlockDates}
              hasActiveUnlocks={hasActiveUnlocks}
            />
          </CardContent>
        </Card>

        {/* Sticky save bar: always reachable with a thumb */}
        <div className="sticky bottom-0 z-10 -mx-1 border-t bg-background/95 px-1 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur">
          <Button type="submit" size="mobile" className="w-full" disabled={lookupLoading}>
            Review & save · {formatKes(total)}
          </Button>
        </div>
      </form>

      {/* Confirmation sheet */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}>
        <DialogContent className="max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:max-w-full max-sm:rounded-b-none max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          <DialogHeader>
            <DialogTitle>Confirm gift</DialogTitle>
            <DialogDescription>Check the details with the giver before saving.</DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 text-sm" data-testid="confirm-summary">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Giver</dt>
              <dd className="text-right font-medium">
                {giverLabel}
                {walkIn ? <span className="block text-xs text-muted-foreground">Walk-in, no SMS</span> : null}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Entry type</dt>
              <dd className="font-medium">{entryTypeLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">{recordForLabel(recordingFor)}</dd>
            </div>
            <div className="border-t pt-3">
              <dt className="sr-only">Lines</dt>
              <dd>
                <ul className="space-y-2">
                  {confirmedLines.map((line, index) => (
                    <li key={index} className="flex justify-between gap-3">
                      <span className="min-w-0">
                        {categoryName(line.categoryId)}
                        {line.purposeId ? (
                          <PurposeName categoryId={line.categoryId} purposeId={line.purposeId} />
                        ) : null}
                        {line.memberIdentifier ? (
                          <span className="block text-xs text-muted-foreground">{line.memberIdentifier}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 tabular-nums">{formatKes(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold tabular-nums" data-testid="confirm-total">
                {formatKes(contributionLinesTotal(confirmedLines))}
              </dd>
            </div>
          </dl>
          {retryable && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
              data-testid="record-retry-notice"
            >
              <WifiOff className="h-4 w-4 shrink-0 text-warning mt-0.5" />
              <p>
                The connection failed, so this gift may not be saved yet. Retry: it will not be recorded twice.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="mobile" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Back
            </Button>
            <Button size="mobile" onClick={handleConfirm} disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : retryable ? (
                <RotateCw className="h-4 w-4 mr-2" />
              ) : null}
              {submitting ? "Saving…" : retryable ? "Retry" : "Confirm & issue receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
