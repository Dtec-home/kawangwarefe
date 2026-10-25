/**
 * Pledge reminder policy for a campaign (Fundraising S1, ticket 1.10).
 * Default (Decision 5): monthly, 3 days before the due date, 1 overdue notice.
 */

"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { CampaignFormValues } from "./campaign-form-schema";
import { FieldError } from "./field-error";

interface ReminderPolicyFieldsProps {
  control: Control<CampaignFormValues>;
  register: UseFormRegister<CampaignFormValues>;
  errors: FieldErrors<CampaignFormValues>;
}

export function ReminderPolicyFields({ control, register, errors }: ReminderPolicyFieldsProps) {
  const policyErrors = errors.reminderPolicy;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Pledge reminders</legend>
      <p className="text-xs text-muted-foreground">SMS reminders go out only between 8am and 8pm.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="campaign-reminder-frequency">How often</Label>
          <Controller
            control={control}
            name="reminderPolicy.frequency"
            render={({ field }) => (
              <Select name="reminderFrequency" value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="campaign-reminder-frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="none">No regular reminders</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="campaign-days-before-due">Days before due date</Label>
          <Input
            id="campaign-days-before-due"
            type="number"
            min={0}
            max={60}
            inputMode="numeric"
            {...register("reminderPolicy.daysBeforeDue", { valueAsNumber: true })}
          />
          <FieldError message={policyErrors?.daysBeforeDue?.message} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="campaign-overdue-notices">Overdue notices</Label>
          <Input
            id="campaign-overdue-notices"
            type="number"
            min={0}
            max={10}
            inputMode="numeric"
            {...register("reminderPolicy.overdueNotices", { valueAsNumber: true })}
          />
          <FieldError message={policyErrors?.overdueNotices?.message} />
        </div>
      </div>
    </fieldset>
  );
}
