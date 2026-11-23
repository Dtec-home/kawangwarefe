/**
 * What the totals post shows, top to bottom (WA-3, US-23): every block with a
 * switch and Move up / Move down, plus the intro and closing text.
 */

"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { moveBlock, toggleBlock } from "@/lib/whatsapp-posts/layout";
import { TEXT_MAX, type SettingsErrors } from "@/lib/whatsapp-posts/validation";
import type { PostSettings, SettingField } from "@/lib/whatsapp-posts/types";

import { FieldError, FieldHint, type FieldHintValue } from "./field-hint";

interface LayoutSectionProps {
  value: PostSettings;
  errors: SettingsErrors;
  hints?: Partial<Record<SettingField, FieldHintValue>>;
  disabled?: boolean;
  set: <K extends SettingField>(field: K, next: PostSettings[K]) => void;
}

function TextField({
  id, label, field, value, error, hint, disabled, placeholder, onChange,
}: {
  id: string; label: string; field: "introText" | "closingText"; value: string; error?: string;
  hint?: FieldHintValue; disabled?: boolean; placeholder: string; onChange: (v: string) => void;
}) {
  const length = value.trim().length;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span data-testid={field === "introText" ? "intro-text-count" : "closing-text-count"}
          className={cn("text-xs tabular-nums", length > TEXT_MAX ? "text-destructive" : "text-muted-foreground")}>
          {length}/{TEXT_MAX}
        </span>
      </div>
      <Textarea id={id} rows={3} disabled={disabled} value={value} placeholder={placeholder}
        aria-invalid={error ? true : undefined} onChange={(e) => onChange(e.target.value)} />
      <FieldHint hint={hint} label={label} />
      <FieldError message={error} />
    </div>
  );
}

export function LayoutSection({ value, errors, hints, disabled, set }: LayoutSectionProps) {
  const layout = value.layout;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Read top to bottom. A block with nothing to say that day is left out.</p>
        <ol aria-label="Post layout" className="divide-y rounded-lg border">
          {layout.map((item, index) => (
            <li key={item.block} className={cn("flex items-center gap-3 px-3 py-2", !item.enabled && "bg-muted/40")}>
              <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", !item.enabled && "text-muted-foreground")}>{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="size-8"
                  aria-label={`Move ${item.label} up`} disabled={disabled || index === 0}
                  onClick={() => set("layout", moveBlock(layout, index, "up"))}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-8"
                  aria-label={`Move ${item.label} down`} disabled={disabled || index === layout.length - 1}
                  onClick={() => set("layout", moveBlock(layout, index, "down"))}>
                  <ArrowDown className="size-4" />
                </Button>
                <Switch aria-label={`Show ${item.label}`} className="ml-1" disabled={disabled} checked={item.enabled}
                  onCheckedChange={(on) => set("layout", toggleBlock(layout, item.block, on))} />
              </div>
            </li>
          ))}
        </ol>
        <FieldHint hint={hints?.layout} label="Post layout" />
        <FieldError message={errors.layout} />
      </div>
      <TextField id="post-intro-text" label="Intro text" field="introText" value={value.introText}
        error={errors.introText} hint={hints?.introText} disabled={disabled}
        placeholder="e.g. Thank you for building God's house with us!"
        onChange={(v) => set("introText", v)} />
      <TextField id="post-closing-text" label="Closing text" field="closingText" value={value.closingText}
        error={errors.closingText} hint={hints?.closingText} disabled={disabled}
        placeholder="e.g. Every shilling counts. God bless you."
        onChange={(v) => set("closingText", v)} />
    </div>
  );
}
