/**
 * The editor's section navigation (§4.5): a vertical stepper on desktop and,
 * on phones (< 640 px), a collapsible section list opened from a
 * "Section n of 8" button. One element in both cases, so the contract's
 * `data-testid="dept-report-stepper"` always holds one button per section,
 * named by the registry title.
 */

"use client";

import { Check, ChevronDown, Circle, MessageSquareWarning } from "lucide-react";

import { requiredSectionCount, type SectionState } from "@/lib/department-reports/sections";
import type { ReportSectionSpec, SectionKey } from "@/lib/department-reports/types";
import { cn } from "@/lib/utils";

interface SectionStepperProps {
  specs: readonly ReportSectionSpec[];
  current: SectionKey | null;
  /** Per section: done, to do, or an empty optional section (never shown as done). */
  states: Record<string, SectionState>;
  /** Sections with a reviewer comment waiting. */
  flagged?: ReadonlySet<string>;
  onSelect: (key: SectionKey) => void;
  /** Phones: is the list open? */
  open: boolean;
  onToggle: () => void;
}

export function SectionStepper({ specs, current, states, flagged, onSelect, open, onToggle }: SectionStepperProps) {
  const index = specs.findIndex((s) => s.key === current);
  const requiredDone = specs.filter((s) => s.required && states[s.key] === "done").length;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="dept-report-stepper"
        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-left text-sm font-medium shadow-xs sm:hidden"
      >
        <span>
          {index >= 0 ? `Section ${index + 1} of ${specs.length}` : "All sections"}
          <span className="font-normal text-muted-foreground">
            {" · "}
            {requiredDone} of {requiredSectionCount(specs)} required done
          </span>
        </span>
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      <nav
        id="dept-report-stepper"
        data-testid="dept-report-stepper"
        aria-label="Report sections"
        className={cn(open ? "block" : "hidden", "sm:block")}
      >
        <ol className="space-y-1 rounded-lg border bg-card p-1.5 shadow-xs sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          {specs.map((spec) => {
            const state = states[spec.key] ?? "todo";
            const done = state === "done";
            const optional = state === "optional";
            const active = spec.key === current;
            const hasComment = flagged?.has(spec.key) ?? false;
            const stateId = `dept-step-state-${spec.key}`;
            return (
              <li key={spec.key}>
                <button
                  type="button"
                  onClick={() => onSelect(spec.key)}
                  aria-current={active ? "step" : undefined}
                  aria-describedby={stateId}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-accent",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                      done ? "border-success bg-success text-success-foreground" : "border-border text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : spec.number}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{spec.title}</span>
                  {hasComment ? (
                    <MessageSquareWarning aria-hidden="true" className="size-4 shrink-0 text-destructive" />
                  ) : optional ? (
                    <span aria-hidden="true" className="shrink-0 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  ) : !done ? (
                    <Circle aria-hidden="true" className="size-2 shrink-0 fill-warning text-warning" />
                  ) : null}
                </button>
                <span id={stateId} className="sr-only">
                  {done ? "Done" : optional ? "Optional, nothing added" : "Not done yet"}
                  {hasComment ? ", the reviewer left a comment" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
