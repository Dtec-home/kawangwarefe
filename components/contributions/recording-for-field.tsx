/**
 * "Recording for" — today, or an open catch-up window's date (T2.8, D13).
 *
 * There is no free date picker: without an open window the entry is for
 * today. Shared by manual entry and the recorder workspace.
 */

"use client";

import { CalendarDays } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEntryDate } from "@/lib/treasury/entry-dates";

/** Select value meaning "record for today" (no date is sent). */
export const RECORD_FOR_TODAY = "today";

/** The chosen date if its window is still open, else today. */
export function effectiveRecordFor(recordFor: string, unlockDates: string[]): string {
  return recordFor !== RECORD_FOR_TODAY && unlockDates.includes(recordFor) ? recordFor : RECORD_FOR_TODAY;
}

/** `{ transactionDate }` for a catch-up date; empty for today. */
export function transactionDateVariables(recordFor: string): { transactionDate?: string } {
  return recordFor !== RECORD_FOR_TODAY ? { transactionDate: recordFor } : {};
}

/** "Today" or "Sat, 29 Aug 2026 (catch-up)" */
export function recordForLabel(recordFor: string): string {
  return recordFor === RECORD_FOR_TODAY ? "Today" : `${formatEntryDate(recordFor)} (catch-up)`;
}

interface RecordingForFieldProps {
  value: string;
  onChange: (value: string) => void;
  unlockDates: string[];
  hasActiveUnlocks: boolean;
}

export function RecordingForField({ value, onChange, unlockDates, hasActiveUnlocks }: RecordingForFieldProps) {
  return (
    <div className="space-y-2" data-testid="recording-for">
      {hasActiveUnlocks ? (
        <>
          <Label htmlFor="recordFor">Recording for</Label>
          <Select name="recordFor" value={value} onValueChange={onChange}>
            <SelectTrigger id="recordFor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RECORD_FOR_TODAY}>Today</SelectItem>
              {unlockDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {recordForLabel(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            A catch-up window is open, so you may record for that past date.
          </p>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Recording for:</span>
          <span className="font-medium">Today</span>
        </p>
      )}
    </div>
  );
}
