/**
 * Campaign form (Fundraising S1, ticket 1.10). Used to create a campaign and,
 * from the Overview tab, to edit one.
 *
 * react-hook-form + zod; the parent runs the mutation and passes back the
 * server's message when it refuses.
 */

"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignInput } from "@/lib/types/fundraising";
import { cn } from "@/lib/utils";

import { COUNTING_MODES, countingModeHint, countingModeLabel } from "../counting/counting-mode";
import {
  EMPTY_CAMPAIGN_FORM,
  campaignFormSchema,
  normalisePaybillCode,
  toCampaignInput,
  type CampaignFormValues,
} from "./campaign-form-schema";
import { FieldError } from "./field-error";
import { GalleryFields } from "./gallery-fields";
import { ReminderPolicyFields } from "./reminder-policy-fields";
import { useCampaignDepartments, useDepartmentPurposes } from "./use-campaign-departments";

const NO_PURPOSE = "none";

const FLAGS = [
  {
    name: "isPublic",
    label: "Show on the public website",
    hint: "Anyone with the link can see the progress (totals only, never names).",
  },
  { name: "allowPledges", label: "Allow pledges", hint: "Members and visitors may promise an amount to give later." },
  { name: "allowChampions", label: "Allow champions", hint: "Members may raise money with their own code and link." },
] as const;

export interface CampaignFormProps {
  defaultValues?: CampaignFormValues;
  submitLabel: string;
  submitting?: boolean;
  /** The server's message when it refused the last save. */
  serverError?: string | null;
  /**
   * Draft and awaiting approval: the counting mode is chosen here. Once
   * approved it is shown read-only; changing it is a request on the Overview.
   */
  countingEditable?: boolean;
  onSubmit: (input: CampaignInput) => void | Promise<void>;
  onCancel?: () => void;
}

export function CampaignForm({
  defaultValues = EMPTY_CAMPAIGN_FORM,
  submitLabel,
  submitting = false,
  serverError,
  onSubmit,
  onCancel,
  countingEditable = true,
}: CampaignFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues,
  });
  const { departments } = useCampaignDepartments();
  const categoryId = useWatch({ control, name: "categoryId" });
  const startDate = useWatch({ control, name: "startDate" });
  const purposes = useDepartmentPurposes(categoryId);
  const paybillCode = register("paybillCode");
  const departmentName = departments.find((d) => d.id === categoryId)?.name;

  const submit = handleSubmit((values) => onSubmit(toCampaignInput(values, { countingEditable })));

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign</CardTitle>
          <CardDescription>What you are raising money for, how much, and by when.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="campaign-title">Title</Label>
            <Input
              id="campaign-title"
              placeholder="e.g. Church Building"
              aria-invalid={errors.title ? true : undefined}
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campaign-department">Department</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  name="categoryId"
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("purposeId", "");
                  }}
                >
                  <SelectTrigger id="campaign-department" className="w-full">
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.categoryId?.message} />
          </div>

          {purposes.length > 0 ? (
            <div className="space-y-1">
              <Label htmlFor="campaign-purpose">Purpose (optional)</Label>
              <Controller
                control={control}
                name="purposeId"
                render={({ field }) => (
                  <Select
                    name="purposeId"
                    value={field.value || NO_PURPOSE}
                    onValueChange={(value) => field.onChange(value === NO_PURPOSE ? "" : value)}
                  >
                    <SelectTrigger id="campaign-purpose" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PURPOSE}>No specific purpose</SelectItem>
                      {purposes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="campaign-target">Target (KES)</Label>
            <Input
              id="campaign-target"
              inputMode="decimal"
              placeholder="e.g. 1000000"
              aria-invalid={errors.targetAmount ? true : undefined}
              {...register("targetAmount")}
            />
            <FieldError message={errors.targetAmount?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campaign-code">Pay Bill account code</Label>
            <Input
              id="campaign-code"
              className="font-mono uppercase"
              maxLength={10}
              autoCapitalize="characters"
              placeholder="e.g. BUILD"
              aria-invalid={errors.paybillCode ? true : undefined}
              aria-describedby="campaign-code-hint"
              {...paybillCode}
              onChange={(e) => {
                e.target.value = normalisePaybillCode(e.target.value);
                return paybillCode.onChange(e);
              }}
            />
            {errors.paybillCode ? (
              <FieldError message={errors.paybillCode.message} />
            ) : (
              <p id="campaign-code-hint" className="text-xs text-muted-foreground">
                Givers type this as the Account number. 2 to 10 capital letters or digits.
              </p>
            )}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="campaign-whatsapp-group">WhatsApp group ID (optional)</Label>
            <Input
              id="campaign-whatsapp-group"
              className="font-mono"
              placeholder="e.g. 120363000000000000@g.us"
              aria-invalid={errors.whatsappGroupId ? true : undefined}
              {...register("whatsappGroupId")}
            />
            <p className="text-xs text-muted-foreground">
              The group that gets the live leaderboard after gifts. Paste the id from the WhatsApp gateway&apos;s{" "}
              <code>/groups</code> list; leave blank for no updates.
            </p>
            <FieldError message={errors.whatsappGroupId?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campaign-start">Start date</Label>
            <Input id="campaign-start" type="date" {...register("startDate")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campaign-end">End date</Label>
            <Input
              id="campaign-end"
              type="date"
              min={startDate || undefined}
              aria-invalid={errors.endDate ? true : undefined}
              {...register("endDate")}
            />
            <FieldError message={errors.endDate?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What counts towards this campaign</CardTitle>
          <CardDescription>
            {countingEditable
              ? "Choose before the campaign is approved. Changing it later needs a second admin or pastor."
              : "Set when the campaign was approved. To change it, ask from the Overview; a second admin or pastor must approve."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="countingMode"
            render={({ field }) => (
              <div role="radiogroup" aria-label="What counts towards this campaign" className="grid gap-3 sm:grid-cols-2">
                {COUNTING_MODES.map((mode) => {
                  const checked = field.value === mode;
                  return (
                    <label
                      key={mode}
                      className={cn(
                        "flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors",
                        "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                        checked ? "border-primary bg-primary/10" : "hover:bg-muted",
                        countingEditable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
                      )}
                    >
                      <input
                        type="radio"
                        name="countingMode"
                        value={mode}
                        checked={checked}
                        disabled={!countingEditable}
                        onChange={() => field.onChange(mode)}
                        className="sr-only"
                      />
                      <span className="font-medium">{countingModeLabel(mode, departmentName)}</span>
                      <span className="text-xs text-muted-foreground">{countingModeHint(mode, departmentName)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Story</CardTitle>
          <CardDescription>What givers see on the campaign page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="campaign-summary">Summary</Label>
            <Input id="campaign-summary" placeholder="One line for share previews" {...register("summary")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="campaign-story">Story</Label>
            <Textarea id="campaign-story" rows={6} {...register("story")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="campaign-cover">Cover image link</Label>
            <Input
              id="campaign-cover"
              type="url"
              placeholder="https://"
              aria-invalid={errors.coverImageUrl ? true : undefined}
              {...register("coverImageUrl")}
            />
            <FieldError message={errors.coverImageUrl?.message} />
          </div>
          <GalleryFields control={control} register={register} errors={errors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {FLAGS.map((flag) => (
            <div key={flag.name} className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={`campaign-${flag.name}`}>{flag.label}</Label>
                <p className="text-xs text-muted-foreground">{flag.hint}</p>
              </div>
              <Controller
                control={control}
                name={flag.name}
                render={({ field }) => (
                  <Switch id={`campaign-${flag.name}`} checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          ))}
          <ReminderPolicyFields control={control} register={register} errors={errors} />
        </CardContent>
      </Card>

      {serverError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
