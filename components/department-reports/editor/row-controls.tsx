/**
 * Move up / move down / remove buttons for one row of a list or the leaders
 * section, plus a tiny hook that moves focus after the list re-renders, so
 * reordering with the keyboard keeps the focus on the moved row.
 */

"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Call `focusAfterRender(id)`; the element is focused once the list has re-rendered. */
export function useFocusAfterRender() {
  const target = useRef<string | null>(null);
  useEffect(() => {
    if (!target.current) return;
    const el = document.getElementById(target.current);
    target.current = null;
    el?.focus();
  });
  return (id: string) => {
    target.current = id;
  };
}

interface RowControlsProps {
  /**
   * Used in the buttons' names: "Move objective number 2 up". The word "number"
   * keeps "Objective 2" (the input's label) out of the buttons' names.
   */
  noun: string;
  position: number;
  count: number;
  idPrefix: string;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

export function RowControls({ noun, position, count, idPrefix, onMove, onRemove }: RowControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        id={`${idPrefix}-up`}
        type="button"
        variant="ghost"
        size="icon-mobile-sm"
        aria-label={`Move ${noun} number ${position} up`}
        disabled={position <= 1}
        onClick={() => onMove(-1)}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        id={`${idPrefix}-down`}
        type="button"
        variant="ghost"
        size="icon-mobile-sm"
        aria-label={`Move ${noun} number ${position} down`}
        disabled={position >= count}
        onClick={() => onMove(1)}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
      <Button
        id={`${idPrefix}-remove`}
        type="button"
        variant="ghost"
        size="icon-mobile-sm"
        aria-label={`Remove ${noun} number ${position}`}
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Which control to focus after moving a row to `newIndex` of `count`. */
export function moveFocusTarget(idPrefix: string, newIndex: number, count: number, delta: -1 | 1): string {
  if (delta === -1) return newIndex > 0 ? `${idPrefix}-up` : `${idPrefix}-down`;
  return newIndex < count - 1 ? `${idPrefix}-down` : `${idPrefix}-up`;
}
