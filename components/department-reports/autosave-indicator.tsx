/**
 * Autosave state for the report editor (DR-6). The text inside
 * `data-testid="autosave-status"` is part of the UI test contract:
 * "Saving…" / "Saved" / "Not saved — retrying".
 */

import { AlertCircle, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "@/lib/department-reports/use-report-draft";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  /** A failed save is waiting for its next retry. */
  retrying?: boolean;
  /** Why the save failed, shown when it will not be retried. */
  error?: string | null;
  lastSavedAt?: Date | null;
  className?: string;
}

function savedTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function message(status: AutosaveStatus, retrying: boolean, error: string | null | undefined): string {
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return retrying || !error ? "Not saved — retrying" : `Not saved — ${error}`;
    default:
      return "";
  }
}

export function AutosaveIndicator({ status, retrying = false, error, lastSavedAt, className }: AutosaveIndicatorProps) {
  const failed = status === "error";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        failed ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {status === "saving" ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : null}
      {status === "saved" ? <Check aria-hidden="true" className="size-3.5 text-success" /> : null}
      {failed ? <AlertCircle aria-hidden="true" className="size-3.5" /> : null}
      <span data-testid="autosave-status" role="status" aria-live="polite">
        {message(status, retrying, error)}
      </span>
      {status === "saved" && lastSavedAt ? <span>· {savedTime(lastSavedAt)}</span> : null}
    </span>
  );
}
