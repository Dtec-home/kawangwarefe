/**
 * Introduction / Conclusion (D14: plain paragraphs with a character limit).
 * The textarea is labelled by the section heading, so its accessible name is
 * exactly the registry title (02_CONTRACTS.md § UI test contract).
 */

"use client";

import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { buildSectionSchema } from "@/lib/department-reports/sections";
import type { ReportSectionSpec } from "@/lib/department-reports/types";
import { cn } from "@/lib/utils";

interface TextSectionEditorProps {
  spec: ReportSectionSpec;
  value: string;
  onChange: (value: string) => void;
  /** The section heading's id (the textarea's label). */
  labelledBy: string;
  /** The section hint's id. */
  describedBy?: string;
}

export function CharacterCounter({ id, count, max }: { id: string; count: number; max: number }) {
  if (max <= 0) return null;
  const over = count > max;
  const near = !over && count >= max * 0.9;
  return (
    <span
      id={id}
      className={cn(
        "text-xs tabular-nums",
        over ? "font-medium text-destructive" : near ? "text-warning" : "text-muted-foreground",
      )}
    >
      {count} / {max} characters
    </span>
  );
}

export function TextSectionEditor({ spec, value, onChange, labelledBy, describedBy }: TextSectionEditorProps) {
  const [touched, setTouched] = useState(false);
  const inputId = `section-${spec.key}-input`;
  const counterId = `${inputId}-counter`;
  const errorId = `${inputId}-error`;
  const over = spec.maxChars > 0 && value.length > spec.maxChars;
  const result = buildSectionSchema(spec).safeParse(value);
  const message = !result.success && (touched || over) ? result.error.issues[0]?.message : null;

  return (
    <div className="space-y-1.5">
      <Textarea
        id={inputId}
        aria-labelledby={labelledBy}
        aria-describedby={[describedBy, counterId, message ? errorId : null].filter(Boolean).join(" ")}
        aria-invalid={message ? true : undefined}
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className="min-h-40"
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        {message ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ) : (
          <span />
        )}
        <CharacterCounter id={counterId} count={value.length} max={spec.maxChars} />
      </div>
    </div>
  );
}
