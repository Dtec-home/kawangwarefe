/**
 * Section 7, Financial Statement (D4, US-6): the figures come from the
 * treasurer's books and are read-only. The leader may add a short note to
 * each line and a narrative note; both are saved through
 * `saveReportFinancialNotes`.
 */

"use client";

import { Info, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatKes } from "@/lib/receipts/format";
import type { FinancialStatement, ReportSectionSpec } from "@/lib/department-reports/types";

import { FinancialTable } from "./financial-table";
import { LINE_NOTE_MAX_CHARS, formatAsOf, lineKey, type FinancialDraft } from "./helpers";
import { CharacterCounter } from "./text-section";

interface FinancialSectionEditorProps {
  spec: ReportSectionSpec;
  statement: FinancialStatement;
  value: FinancialDraft;
  onChange: (value: FinancialDraft) => void;
  describedBy?: string;
}

const ROW_HELP: { term: string; meaning: string }[] = [
  { term: "Balance brought forward", meaning: "What the fund held the day before the period started." },
  { term: "Money in", meaning: "Gifts received in the period, one line per purpose, then General." },
  { term: "Money out", meaning: "Approved and paid expenses in the period, one line per purpose, then Other." },
  { term: "Balance carried forward", meaning: "Brought forward + money in − money out." },
];

export function FinancialSectionEditor({ spec, statement, value, onChange, describedBy }: FinancialSectionEditorProps) {
  const noteId = "financial-note-input";
  const noteCounterId = `${noteId}-counter`;
  const tooLong = spec.maxChars > 0 && value.note.length > spec.maxChars;

  const setLineNote = (key: string, note: string) =>
    onChange({ ...value, lineNotes: { ...value.lineNotes, [key]: note } });

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="financial-as-of">
        <Lock aria-hidden="true" className="size-4" />
        {statement.frozen
          ? `Frozen on submission (${formatAsOf(statement.asOf)})`
          : `From the treasurer's books as of ${formatAsOf(statement.asOf)}`}
      </p>

      <FinancialTable
        statement={statement}
        caption={`${spec.title}: figures from the books, with your notes`}
        renderLineNote={(line) => {
          const key = lineKey(line);
          const note = value.lineNotes[key] ?? "";
          const id = `financial-line-note-${line.direction}-${line.label.replace(/[^a-z0-9]+/gi, "-")}`;
          const direction = line.direction === "in" ? "money in" : "money out";
          return (
            <div className="space-y-0.5">
              <label htmlFor={id} className="sr-only">
                {`Note for ${direction}: ${line.label}`}
              </label>
              <Input
                id={id}
                value={note}
                maxLength={LINE_NOTE_MAX_CHARS}
                placeholder="Add a note (optional)"
                onChange={(e) => setLineNote(key, e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          );
        }}
      />

      {statement.pendingRequisitionCount > 0 ? (
        <p role="note" className="flex items-start gap-2 rounded-lg bg-info/10 p-3 text-sm" data-testid="financial-pending">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          <span>
            {statement.pendingRequisitionCount === 1
              ? "1 requisition"
              : `${statement.pendingRequisitionCount} requisitions`}{" "}
            ({formatKes(statement.pendingRequisitionTotal)}) still waiting for approval{" "}
            {statement.pendingRequisitionCount === 1 ? "is" : "are"} not counted in money out.
          </span>
        </p>
      ) : null}

      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium">What do these rows mean?</summary>
        <dl className="mt-2 space-y-1.5">
          {ROW_HELP.map(({ term, meaning }) => (
            <div key={term}>
              <dt className="font-medium">{term}</dt>
              <dd className="text-muted-foreground">{meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-muted-foreground">
          The amounts can&apos;t be changed here. If a figure looks wrong, ask the treasurer to correct the books.
        </p>
      </details>

      <div className="space-y-1.5">
        <label htmlFor={noteId} className="text-sm font-medium">
          Note on the money (optional)
        </label>
        <Textarea
          id={noteId}
          rows={4}
          value={value.note}
          aria-describedby={[describedBy, noteCounterId].filter(Boolean).join(" ")}
          aria-invalid={tooLong ? true : undefined}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
        />
        <div className="flex justify-end">
          <CharacterCounter id={noteCounterId} count={value.note.length} max={spec.maxChars} />
        </div>
      </div>
    </div>
  );
}
