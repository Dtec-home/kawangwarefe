/**
 * Section 2, Leaders: prefilled from the department's leaders (D8), editable
 * rows of name, role and phone. Each row's title shows the leader's name, so
 * the list reads as text as well as inputs.
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportSectionSpec } from "@/lib/department-reports/types";

import { moveRow, newRowKey, type LeaderRow } from "./helpers";
import { RowControls, moveFocusTarget, useFocusAfterRender } from "./row-controls";

interface LeadersSectionEditorProps {
  spec: ReportSectionSpec;
  rows: LeaderRow[];
  onChange: (rows: LeaderRow[]) => void;
}

export function LeadersSectionEditor({ spec, rows, onChange }: LeadersSectionEditorProps) {
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const focusAfterRender = useFocusAfterRender();
  const filled = rows.filter((r) => r.name.trim()).length;
  const full = spec.maxItems > 0 && rows.length >= spec.maxItems;
  const tooFew = spec.minItems > 0 && filled < spec.minItems;

  const update = (index: number, patch: Partial<LeaderRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const add = () => {
    const row: LeaderRow = { key: newRowKey("leader"), name: "", roleTitle: "", phone: "", memberId: null };
    focusAfterRender(`leaders-${row.key}-name`);
    onChange([...rows, row]);
  };

  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    const neighbour = next[index] ?? next[index - 1];
    focusAfterRender(neighbour ? `leaders-${neighbour.key}-name` : "leaders-add");
    onChange(next);
  };

  const move = (index: number, delta: -1 | 1) => {
    const next = moveRow(rows, index, delta);
    focusAfterRender(moveFocusTarget(`leaders-${rows[index].key}`, index + delta, next.length, delta));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div data-testid="dept-report-leaders">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No leaders yet.</p>
        ) : (
          <ol className="space-y-3">
            {rows.map((row, index) => {
              const position = index + 1;
              const prefix = `leaders-${row.key}`;
              const nameError = touched.has(row.key) && !row.name.trim();
              return (
                <li key={row.key}>
                  <fieldset className="rounded-lg border bg-card p-3 shadow-xs">
                    <legend className="sr-only">Leader {position}</legend>
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 pt-2 text-sm font-semibold break-words">
                        {row.name.trim() || `Leader ${position}`}
                        {row.roleTitle.trim() ? (
                          <span className="font-normal text-muted-foreground"> · {row.roleTitle}</span>
                        ) : null}
                      </p>
                      <RowControls
                        noun="leader"
                        position={position}
                        count={rows.length}
                        idPrefix={prefix}
                        onMove={(delta) => move(index, delta)}
                        onRemove={() => remove(index)}
                      />
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label htmlFor={`${prefix}-name`} className="text-xs font-medium text-muted-foreground">
                          <span className="sr-only">Leader {position} </span>Name
                        </label>
                        <Input
                          id={`${prefix}-name`}
                          value={row.name}
                          autoComplete="off"
                          aria-invalid={nameError ? true : undefined}
                          aria-describedby={nameError ? `${prefix}-name-error` : undefined}
                          onChange={(e) => update(index, { name: e.target.value })}
                          onBlur={() => setTouched((prev) => new Set(prev).add(row.key))}
                        />
                        {nameError ? (
                          <p id={`${prefix}-name-error`} role="alert" className="text-xs text-destructive">
                            Name is required
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`${prefix}-role`} className="text-xs font-medium text-muted-foreground">
                          <span className="sr-only">Leader {position} </span>Role
                        </label>
                        <Input
                          id={`${prefix}-role`}
                          value={row.roleTitle}
                          autoComplete="off"
                          placeholder="e.g. Secretary"
                          onChange={(e) => update(index, { roleTitle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`${prefix}-phone`} className="text-xs font-medium text-muted-foreground">
                          <span className="sr-only">Leader {position} </span>Phone
                        </label>
                        <Input
                          id={`${prefix}-phone`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="off"
                          value={row.phone}
                          onChange={(e) => update(index, { phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button id="leaders-add" type="button" variant="outline" size="mobile-sm" onClick={add} disabled={full}>
          <Plus aria-hidden="true" />
          Add leader
        </Button>
        {tooFew ? <p className="text-sm text-warning">Add at least {spec.minItems} leader</p> : null}
      </div>
    </div>
  );
}
