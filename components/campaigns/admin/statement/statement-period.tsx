"use client";

/**
 * The period the Statement tab covers: "All time" (default) or a date range
 * with either end optional. Scopes the summary, charts, table and export.
 */

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StatementPeriod } from "@/lib/graphql/fundraising/statement";
import { ALL_TIME } from "@/components/campaigns/admin/statement/statement-model";

interface StatementPeriodPickerProps {
  value: StatementPeriod;
  onChange: (period: StatementPeriod) => void;
}

export function StatementPeriodPicker({ value, onChange }: StatementPeriodPickerProps) {
  const id = useId();
  const [ranged, setRanged] = useState(value.dateFrom !== null || value.dateTo !== null);

  const chooseAllTime = () => {
    setRanged(false);
    onChange(ALL_TIME);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Period</span>
        <div role="group" aria-label="Period" className="flex gap-2">
          <Button type="button" size="sm" variant={ranged ? "outline" : "default"} aria-pressed={!ranged} onClick={chooseAllTime}>
            All time
          </Button>
          <Button type="button" size="sm" variant={ranged ? "default" : "outline"} aria-pressed={ranged} onClick={() => setRanged(true)}>
            Date range
          </Button>
        </div>
      </div>
      {ranged && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${id}-from`}>From</Label>
            <Input
              id={`${id}-from`}
              type="date"
              className="h-8 w-40"
              value={value.dateFrom ?? ""}
              onChange={(e) => onChange({ ...value, dateFrom: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-to`}>To</Label>
            <Input
              id={`${id}-to`}
              type="date"
              className="h-8 w-40"
              value={value.dateTo ?? ""}
              onChange={(e) => onChange({ ...value, dateTo: e.target.value || null })}
            />
          </div>
        </>
      )}
    </div>
  );
}
