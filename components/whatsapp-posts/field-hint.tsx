/** A "Church: …" hint under a setting, with a way back to the church value (WA-3). */

"use client";

import { Button } from "@/components/ui/button";

export interface FieldHintValue {
  text: string;
  /** Set for a field the campaign changed: go back to the church value. */
  onReset?: () => void;
}

export function FieldHint({ hint, label }: { hint?: FieldHintValue; label: string }) {
  if (!hint) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      <span>{hint.text}</span>
      {hint.onReset ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          aria-label={`Use the church value for ${label}`}
          onClick={hint.onReset}
        >
          Use the church value
        </Button>
      ) : null}
    </p>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
