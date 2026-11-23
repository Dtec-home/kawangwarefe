/**
 * Objectives, Achievements, Challenges, Recommendations (D14: lists of short
 * items). Add, remove and reorder with buttons (keyboard friendly). On
 * Achievements each item can name the objective it fulfils, from a native
 * select of the report's saved objectives.
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ITEM_MAX_CHARS, buildSectionSchema, type ListSectionKey } from "@/lib/department-reports/sections";
import type { ReportSectionSpec } from "@/lib/department-reports/types";

import { moveRow, newRowKey, toItemInputs, type ItemRow } from "./helpers";
import { RowControls, moveFocusTarget, useFocusAfterRender } from "./row-controls";
import { CharacterCounter } from "./text-section";

export const ITEM_NOUNS: Record<ListSectionKey, string> = {
  objectives: "objective",
  achievements: "achievement",
  challenges: "challenge",
  recommendations: "recommendation",
};

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export interface ObjectiveOption {
  id: string;
  text: string;
}

interface ListSectionEditorProps {
  spec: ReportSectionSpec & { key: ListSectionKey };
  rows: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  /** Achievements only: the objectives an achievement may fulfil. */
  objectives?: ObjectiveOption[];
  describedBy?: string;
}

function shorten(text: string, max = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function ListSectionEditor({ spec, rows, onChange, objectives, describedBy }: ListSectionEditorProps) {
  const noun = ITEM_NOUNS[spec.key];
  const Noun = capitalise(noun);
  const maxChars = spec.maxChars > 0 ? spec.maxChars : ITEM_MAX_CHARS;
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const focusAfterRender = useFocusAfterRender();
  const prefix = (row: ItemRow) => `${spec.key}-${row.key}`;

  const filled = rows.filter((r) => r.text.trim());
  const countResult = buildSectionSchema(spec).safeParse(toItemInputs(filled));
  const countMessage = countResult.success
    ? null
    : (countResult.error.issues.find((issue) => issue.path.length === 0)?.message ?? null);
  const full = spec.maxItems > 0 && rows.length >= spec.maxItems;
  const optionIds = new Set((objectives ?? []).map((o) => o.id));

  const update = (index: number, patch: Partial<ItemRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const add = () => {
    const row: ItemRow = { key: newRowKey(spec.key), id: null, text: "", fulfilsId: null };
    focusAfterRender(`${spec.key}-${row.key}-text`);
    onChange([...rows, row]);
  };

  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    const neighbour = next[index] ?? next[index - 1];
    focusAfterRender(neighbour ? `${spec.key}-${neighbour.key}-text` : `${spec.key}-add`);
    onChange(next);
  };

  const move = (index: number, delta: -1 | 1) => {
    const next = moveRow(rows, index, delta);
    focusAfterRender(moveFocusTarget(prefix(rows[index]), index + delta, next.length, delta));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No {noun}s yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, index) => {
            const position = index + 1;
            const inputId = `${prefix(row)}-text`;
            const errorId = `${prefix(row)}-error`;
            const counterId = `${prefix(row)}-counter`;
            const label = `${Noun} ${position}`;
            const tooLong = row.text.length > maxChars;
            const blank = touched.has(row.key) && !row.text.trim();
            const error = tooLong
              ? `Keep it under ${maxChars} characters`
              : blank
                ? "Write something or remove this line"
                : null;
            const selectId = `${prefix(row)}-fulfils`;
            return (
              <li key={row.key} className="rounded-lg border bg-card p-3 shadow-xs">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <label htmlFor={inputId} className="text-sm font-medium">
                      {label}
                    </label>
                    <Textarea
                      id={inputId}
                      rows={2}
                      value={row.text}
                      aria-describedby={[describedBy, counterId, error ? errorId : null].filter(Boolean).join(" ")}
                      aria-invalid={error ? true : undefined}
                      onChange={(e) => update(index, { text: e.target.value })}
                      onBlur={() => setTouched((prev) => new Set(prev).add(row.key))}
                      className="min-h-11"
                    />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      {error ? (
                        <p id={errorId} role="alert" className="text-sm text-destructive">
                          {error}
                        </p>
                      ) : (
                        <span />
                      )}
                      <CharacterCounter id={counterId} count={row.text.length} max={maxChars} />
                    </div>
                    {objectives ? (
                      <div className="space-y-1">
                        <label htmlFor={selectId} className="text-sm text-muted-foreground">
                          Fulfils objective<span className="sr-only"> (achievement number {position})</span>
                        </label>
                        <select
                          id={selectId}
                          value={row.fulfilsId && optionIds.has(row.fulfilsId) ? row.fulfilsId : ""}
                          onChange={(e) => update(index, { fulfilsId: e.target.value || null })}
                          className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 block h-11 w-full min-w-0 rounded-md border bg-transparent px-3 text-base shadow-xs outline-none focus-visible:ring-[3px] md:h-9 md:text-sm"
                        >
                          <option value="">—</option>
                          {objectives.map((objective) => (
                            <option key={objective.id} value={objective.id}>
                              {shorten(objective.text)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                  <RowControls
                    noun={noun}
                    position={position}
                    count={rows.length}
                    idPrefix={prefix(row)}
                    onMove={(delta) => move(index, delta)}
                    onRemove={() => remove(index)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {objectives && objectives.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add objectives first to link an achievement to the objective it fulfils.</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button id={`${spec.key}-add`} type="button" variant="outline" size="mobile-sm" onClick={add} disabled={full}>
          <Plus aria-hidden="true" />
          {`Add ${noun}`}
        </Button>
        {countMessage ? (
          <p className="text-sm text-warning" data-testid={`${spec.key}-count-message`}>
            {countMessage}
          </p>
        ) : spec.maxItems > 0 ? (
          <p className="text-xs text-muted-foreground">
            {filled.length} of up to {spec.maxItems}
          </p>
        ) : null}
      </div>
    </div>
  );
}
