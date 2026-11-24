/**
 * When the totals post goes (WA-3, E8): every N minutes in a window, at fixed
 * times, or once a day; on which days; the final daily post; and the
 * "only when changed" / "even when nothing was given" switches.
 */

"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SCHEDULE_KIND_LABELS, WEEKDAYS } from "@/lib/whatsapp-posts/schedule";
import { MIN_INTERVAL_MINUTES, type SettingsErrors } from "@/lib/whatsapp-posts/validation";
import { SCHEDULE_KINDS, type PostSettings, type SettingField } from "@/lib/whatsapp-posts/types";

import { FieldError, FieldHint, type FieldHintValue } from "./field-hint";

const INTERVALS = [30, 45, 60, 90, 120, 180, 240];
export const DEFAULT_FINAL_TIME = "23:50";

function intervalLabel(minutes: number): string {
  if (minutes % 60 === 0) return minutes === 60 ? "1 hour" : `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

export const SELECT_CLASS =
  "h-10 md:h-9 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30 disabled:opacity-50 dark:bg-input/30";

interface ScheduleSectionProps {
  value: PostSettings;
  errors: SettingsErrors;
  hints?: Partial<Record<SettingField, FieldHintValue>>;
  disabled?: boolean;
  set: <K extends SettingField>(field: K, next: PostSettings[K]) => void;
}

function nextFreeTime(taken: string[]): string {
  for (const t of ["12:00", "18:00", "08:00", "15:00", "20:00"]) if (!taken.includes(t)) return t;
  return "12:00";
}

export function ScheduleSection({ value, errors, hints, disabled, set }: ScheduleSectionProps) {
  const intervals = INTERVALS.includes(value.intervalMinutes) || value.intervalMinutes < MIN_INTERVAL_MINUTES
    ? INTERVALS
    : [...INTERVALS, value.intervalMinutes].sort((a, b) => a - b);
  const daily = value.scheduleKind === "daily";

  const toggleDay = (day: number) => {
    const has = value.daysOfWeek.includes(day);
    set("daysOfWeek", has ? value.daysOfWeek.filter((d) => d !== day) : [...value.daysOfWeek, day].sort((a, b) => a - b));
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">How often</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          {SCHEDULE_KINDS.map((kind) => (
            <label key={kind} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="post-schedule-kind"
                value={kind}
                className="size-4 accent-primary"
                checked={value.scheduleKind === kind}
                onChange={() => set("scheduleKind", kind)}
              />
              {SCHEDULE_KIND_LABELS[kind]}
            </label>
          ))}
        </div>
        <FieldHint hint={hints?.scheduleKind} label="How often" />
        <FieldError message={errors.scheduleKind} />
      </fieldset>

      {value.scheduleKind === "interval" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="post-interval">Post every</Label>
            <select
              id="post-interval"
              className={SELECT_CLASS}
              disabled={disabled}
              value={String(value.intervalMinutes)}
              onChange={(e) => set("intervalMinutes", Number(e.target.value))}
            >
              {value.intervalMinutes < MIN_INTERVAL_MINUTES ? (
                <option value={String(value.intervalMinutes)} disabled>
                  {value.intervalMinutes} minutes (too often)
                </option>
              ) : null}
              {intervals.map((m) => (
                <option key={m} value={String(m)}>
                  {intervalLabel(m)}
                </option>
              ))}
            </select>
            <FieldHint hint={hints?.intervalMinutes} label="Post every" />
            <FieldError message={errors.intervalMinutes} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-window-start">Window start</Label>
            <Input id="post-window-start" type="time" disabled={disabled} value={value.windowStart}
              aria-invalid={errors.windowStart ? true : undefined}
              onChange={(e) => set("windowStart", e.target.value)} />
            <FieldHint hint={hints?.windowStart} label="Window start" />
            <FieldError message={errors.windowStart} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-window-end">Window end</Label>
            <Input id="post-window-end" type="time" disabled={disabled} value={value.windowEnd}
              aria-invalid={errors.windowEnd ? true : undefined}
              onChange={(e) => set("windowEnd", e.target.value)} />
            <FieldHint hint={hints?.windowEnd} label="Window end" />
            <FieldError message={errors.windowEnd} />
          </div>
        </div>
      ) : null}

      {value.scheduleKind === "fixed_times" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Times</p>
          <ul className="flex flex-wrap gap-2" aria-label="Fixed times">
            {value.fixedTimes.map((time, index) => (
              <li key={index} className="flex items-center gap-1">
                <Input
                  type="time"
                  className="w-32"
                  aria-label={`Fixed time ${index + 1}`}
                  disabled={disabled}
                  value={time}
                  onChange={(e) => set("fixedTimes", value.fixedTimes.map((t, i) => (i === index ? e.target.value : t)))}
                />
                <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Remove ${time || "this time"}`}
                  onClick={() => set("fixedTimes", value.fixedTimes.filter((_, i) => i !== index))}>
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" disabled={disabled}
            onClick={() => set("fixedTimes", [...value.fixedTimes, nextFreeTime(value.fixedTimes)])}>
            <Plus className="size-4" /> Add a time
          </Button>
          <FieldHint hint={hints?.fixedTimes} label="Times" />
          <FieldError message={errors.fixedTimes} />
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium" id="post-days-label">Days</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="post-days-label">
          {WEEKDAYS.map((day) => {
            const on = value.daysOfWeek.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                aria-label={day.long}
                aria-pressed={on}
                disabled={disabled}
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "h-9 min-w-11 rounded-md border px-2 text-sm font-medium transition-colors disabled:opacity-50",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                {day.short}
              </button>
            );
          })}
        </div>
        <FieldHint hint={hints?.daysOfWeek} label="Days" />
        <FieldError message={errors.daysOfWeek} />
      </div>

      <div className="space-y-2">
        {daily ? (
          <div className="space-y-1 sm:max-w-48">
            <Label htmlFor="post-final-time">Post time</Label>
            <Input id="post-final-time" type="time" disabled={disabled} value={value.finalPostTime ?? ""}
              onChange={(e) => set("finalPostTime", e.target.value || null)} />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="post-final-switch">Final daily post</Label>
                <p className="text-xs text-muted-foreground">One last post at the end of the day. It always goes, even if nothing changed.</p>
              </div>
              <Switch
                id="post-final-switch"
                disabled={disabled}
                checked={value.finalPostTime !== null}
                onCheckedChange={(on) => set("finalPostTime", on ? DEFAULT_FINAL_TIME : null)}
              />
            </div>
            {value.finalPostTime !== null ? (
              <div className="space-y-1 sm:max-w-48">
                <Label htmlFor="post-final-time">Final post time</Label>
                <Input id="post-final-time" type="time" disabled={disabled} value={value.finalPostTime}
                  onChange={(e) => set("finalPostTime", e.target.value || null)} />
              </div>
            ) : null}
          </>
        )}
        <FieldHint hint={hints?.finalPostTime} label={daily ? "Post time" : "Final daily post"} />
        <FieldError message={errors.finalPostTime} />
      </div>

      {!daily ? (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="post-only-changed">Only post when something changed</Label>
            <p className="text-xs text-muted-foreground">Skips a post that would say the same as the last one. Keeps the group quiet and the number safe.</p>
            <FieldHint hint={hints?.onlyWhenChanged} label="Only post when something changed" />
          </div>
          <Switch id="post-only-changed" disabled={disabled} checked={value.onlyWhenChanged}
            onCheckedChange={(on) => set("onlyWhenChanged", on)} />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="post-when-zero">Post even when nothing was given</Label>
          <p className="text-xs text-muted-foreground">Off: days with no gifts get no post.</p>
          <FieldHint hint={hints?.postWhenZero} label="Post even when nothing was given" />
        </div>
        <Switch id="post-when-zero" disabled={disabled} checked={value.postWhenZero}
          onCheckedChange={(on) => set("postWhenZero", on)} />
      </div>
    </div>
  );
}
