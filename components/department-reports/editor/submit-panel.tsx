/**
 * Preview & submit (US-7): the report laid out like the PDF, the sections
 * still missing (each a link back to the section), and "Submit report",
 * which asks for confirmation once.
 */

"use client";

import { useState } from "react";
import { ArrowLeft, CircleAlert, Send } from "lucide-react";

import { ReportPreview, type ReportPreviewData } from "@/components/department-reports/report-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MissingSection, ReportSectionSpec, SectionKey } from "@/lib/department-reports/types";

import { missingReasonLabel } from "./helpers";

interface SubmitPanelProps {
  preview: ReportPreviewData;
  specs: readonly ReportSectionSpec[];
  missing: readonly MissingSection[];
  /** Why "Submit report" is disabled even though nothing is missing (e.g. still saving). */
  waitingReason: string | null;
  canSubmit: boolean;
  onGoTo: (key: SectionKey) => void;
  onBack: () => void;
  /** Resolves true when the report was submitted. */
  onSubmit: () => Promise<boolean>;
}

export function MissingSections({
  missing,
  specs,
  onGoTo,
}: {
  missing: readonly MissingSection[];
  specs: readonly ReportSectionSpec[];
  onGoTo: (key: SectionKey) => void;
}) {
  const titles = new Map(specs.map((s) => [s.key, s.title]));
  return (
    <section
      data-testid="dept-report-missing"
      aria-labelledby="dept-report-missing-title"
      className="space-y-2 rounded-xl border border-warning/40 bg-warning/10 p-4"
    >
      <h2 id="dept-report-missing-title" className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden="true" className="size-5 text-warning" />
        {missing.length === 1 ? "1 section still needs work" : `${missing.length} sections still need work`}
      </h2>
      <ul className="space-y-1 pl-7 text-sm">
        {missing.map((m) => (
          <li key={m.key}>
            <a
              href={`#dept-section-${m.key}`}
              onClick={(e) => {
                e.preventDefault();
                onGoTo(m.key);
              }}
              className="font-medium text-primary underline underline-offset-4"
            >
              {titles.get(m.key) ?? m.key}
            </a>
            <span className="text-muted-foreground"> — {missingReasonLabel(m)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SubmitPanel({
  preview,
  specs,
  missing,
  waitingReason,
  canSubmit,
  onGoTo,
  onBack,
  onSubmit,
}: SubmitPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const blocked = missing.length > 0 || !!waitingReason || !canSubmit;

  const submit = async () => {
    setSubmitting(true);
    try {
      const ok = await onSubmit();
      if (ok) setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="mobile-sm" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to editing
        </Button>
      </div>

      {missing.length > 0 ? <MissingSections missing={missing} specs={specs} onGoTo={onGoTo} /> : null}

      <ReportPreview report={preview} specs={specs} />

      <div className="flex flex-col items-stretch gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" id="dept-report-submit-help">
          {missing.length > 0
            ? "Fill in the sections above before you submit."
            : waitingReason
              ? waitingReason
              : !canSubmit
                ? "You can't submit this report."
                : "Everything is filled in. The money figures are frozen when you submit."}
        </p>
        <Button
          type="button"
          size="mobile"
          disabled={blocked}
          aria-describedby="dept-report-submit-help"
          onClick={() => setConfirming(true)}
        >
          <Send aria-hidden="true" />
          Submit report
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={(open) => !submitting && setConfirming(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit report?</DialogTitle>
            <DialogDescription>
              The pastor will review it. You can&apos;t change it after submitting unless it is sent back to you, and
              the money figures are frozen as they are now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
