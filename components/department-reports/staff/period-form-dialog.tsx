"use client";

/**
 * "Open reporting period" / "Edit reporting period" dialog (DR-8, US-1).
 * Validates `start < end <= due` before sending; a server ReportError is
 * shown inside the dialog in plain words.
 */

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CalendarPlus, Loader2, Save } from "lucide-react";
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
import { isReportError, OPEN_REPORTING_PERIOD, UPDATE_REPORTING_PERIOD } from "@/lib/graphql/department-reports";
import type { ReportingPeriod, ReportingPeriodResult } from "@/lib/department-reports/types";
import {
  hasPeriodErrors,
  PERIOD_LABEL_MAX,
  periodFormValues,
  periodInput,
  validatePeriodForm,
  type PeriodFormErrors,
  type PeriodFormValues,
} from "@/components/department-reports/staff/period-form";
import { reportErrorMessage, thrownMessage } from "@/components/department-reports/staff/report-errors";

interface PeriodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this period; open a new one when absent. */
  period?: ReportingPeriod | null;
  onSaved?: (period: ReportingPeriod) => void;
}

const FIELDS: ReadonlyArray<{ key: keyof PeriodFormValues; label: string; type: "text" | "date"; help?: string }> = [
  { key: "label", label: "Label", type: "text", help: "The church year, as it should appear on the reports." },
  { key: "startDate", label: "Start date", type: "date" },
  { key: "endDate", label: "End date", type: "date" },
  { key: "dueDate", label: "Due date", type: "date", help: "Leaders should hand in their reports by this day." },
];

function PeriodForm({ period, onSaved, onCancel }: { period?: ReportingPeriod | null; onSaved: (p: ReportingPeriod) => void; onCancel: () => void }) {
  const editing = !!period;
  const [values, setValues] = useState<PeriodFormValues>(() => periodFormValues(period));
  const [errors, setErrors] = useState<PeriodFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [openPeriod, { loading: opening }] = useMutation(OPEN_REPORTING_PERIOD);
  const [updatePeriod, { loading: updating }] = useMutation(UPDATE_REPORTING_PERIOD);
  const saving = opening || updating;

  const set = (key: keyof PeriodFormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validatePeriodForm(values);
    setErrors(found);
    setServerError(null);
    if (hasPeriodErrors(found)) return;

    const input = periodInput(values);
    try {
      let result: ReportingPeriodResult | undefined;
      if (editing && period) {
        result = (await updatePeriod({ variables: { id: period.id, input } })).data?.updateReportingPeriod;
      } else {
        result = (await openPeriod({ variables: { input } })).data?.openReportingPeriod;
      }
      if (!result || isReportError(result)) {
        setServerError(reportErrorMessage(isReportError(result) ? result : null, "The period could not be saved."));
        return;
      }
      toast.success(editing ? `Period ${result.label} updated` : `Period ${result.label} opened`);
      onSaved(result);
    } catch (error) {
      setServerError(thrownMessage(error, "The period could not be saved."));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {FIELDS.map(({ key, label, type, help }) => {
        const id = `period-${key}`;
        const error = errors[key];
        const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;
        return (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              type={type}
              value={values[key]}
              placeholder={key === "label" ? "2025-2026" : undefined}
              maxLength={key === "label" ? PERIOD_LABEL_MAX : undefined}
              onChange={(e) => set(key, e.target.value)}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
            {error ? (
              <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>
            ) : help ? (
              <p id={`${id}-help`} className="text-xs text-muted-foreground">{help}</p>
            ) : null}
          </div>
        );
      })}

      {serverError ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : editing ? (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {editing ? "Save changes" : "Open period"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PeriodFormDialog({ open, onOpenChange, period, onSaved }: PeriodFormDialogProps) {
  const editing = !!period;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit reporting period" : "Open reporting period"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Change the label or dates. Leaders see the new due date straight away."
              : "Every department writes one report for this period. Only one period can be open at a time."}
          </DialogDescription>
        </DialogHeader>
        {/* Remounts on each open so the form starts from the period being edited. */}
        {open ? (
          <PeriodForm
            key={period?.id ?? "new"}
            period={period}
            onCancel={() => onOpenChange(false)}
            onSaved={(saved) => {
              onOpenChange(false);
              onSaved?.(saved);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
