/**
 * Record a pledge written on a paper card (Fundraising S3, lane S3-UI-F,
 * ticket 3.11): the giver's phone, their name when they are new, a campaign
 * or a department, the amount and an optional due date → recordPledge.
 *
 * The backend finds the member by phone (or creates one with the name given)
 * and limits department admins to their own departments.
 */

"use client";

import { useState } from "react";
import { Controller, useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { toKenyanMsisdn } from "@/components/campaigns/give/phone";
import { PhoneInput } from "@/components/forms/phone-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PLEDGE_REGISTER_QUERIES,
  RECORD_PLEDGE,
  type RecordPledgeData,
  type RecordPledgeVars,
} from "@/lib/graphql/fundraising/admin-pledges";

import { usePledgeScopeOptions } from "./use-pledge-scope-options";

type TargetKind = "campaign" | "department";

const schema = z
  .object({
    phoneNumber: z.string().refine((v) => toKenyanMsisdn(v) !== null, {
      message: "Enter a valid Safaricom or Airtel number",
    }),
    memberName: z.string().max(120, { message: "Keep the name under 120 characters" }),
    kind: z.enum(["campaign", "department"]),
    campaignId: z.string(),
    categoryId: z.string(),
    amount: z.string().refine((v) => Number.parseFloat(v) >= 1, { message: "Amount must be at least KES 1" }),
    dueDate: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "campaign" && !v.campaignId) {
      ctx.addIssue({ code: "custom", path: ["campaignId"], message: "Choose a campaign" });
    }
    if (v.kind === "department" && !v.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a department" });
    }
  });

type FormValues = z.infer<typeof schema>;

const FAILED = "Could not record the pledge";

/** The mutation variables for a valid form. */
export function toRecordPledgeVars(values: FormValues): RecordPledgeVars {
  const forCampaign = values.kind === "campaign";
  return {
    phoneNumber: toKenyanMsisdn(values.phoneNumber)!,
    memberName: values.memberName.trim() || null,
    input: {
      amount: values.amount,
      campaignId: forCampaign ? values.campaignId : null,
      categoryId: forCampaign ? null : values.categoryId,
      dueDate: values.dueDate || null,
    },
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

interface RecordPledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Record for this campaign only (the campaign's Pledges tab). */
  fixedCampaignId?: string;
}

const KIND_OPTIONS: { value: TargetKind; label: string }[] = [
  { value: "campaign", label: "Campaign" },
  { value: "department", label: "Department" },
];

/** The "pledge for" choice; only mounted when the campaign is not fixed. */
function TargetFields({
  control,
  errors,
}: {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  const { campaigns, departments } = usePledgeScopeOptions();
  const kind = useWatch({ control, name: "kind" });
  const openCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

  return (
    <>
      <Controller
        control={control}
        name="kind"
        render={({ field }) => (
          <div className="space-y-2">
            <span className="text-sm font-medium leading-none">Pledge for</span>
            <div role="group" aria-label="Pledge for" className="flex gap-2">
              {KIND_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={field.value === option.value ? "default" : "outline"}
                  aria-pressed={field.value === option.value}
                  onClick={() => field.onChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      />
      {kind === "campaign" ? (
        <Controller
          control={control}
          name="campaignId"
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="record-pledge-campaign">Campaign</Label>
              <Select name="campaignId" value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="record-pledge-campaign" className="w-full">
                  <SelectValue placeholder="Choose a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {openCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.campaignId?.message} />
            </div>
          )}
        />
      ) : (
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="record-pledge-department">Department</Label>
              <Select name="categoryId" value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="record-pledge-department" className="w-full">
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.categoryId?.message} />
            </div>
          )}
        />
      )}
    </>
  );
}

export function RecordPledgeDialog({ open, onOpenChange, fixedCampaignId }: RecordPledgeDialogProps) {
  const defaultValues: FormValues = {
    phoneNumber: "",
    memberName: "",
    kind: "campaign",
    campaignId: fixedCampaignId ?? "",
    categoryId: "",
    amount: "",
    dueDate: "",
  };
  const [serverError, setServerError] = useState<string | null>(null);
  const [recordPledge, { loading }] = useMutation<RecordPledgeData, RecordPledgeVars>(RECORD_PLEDGE, {
    refetchQueries: PLEDGE_REGISTER_QUERIES,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const close = (next: boolean) => {
    if (!next) {
      reset(defaultValues);
      setServerError(null);
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { data } = await recordPledge({ variables: toRecordPledgeVars(values) });
      const result = data?.recordPledge;
      if (result?.success) {
        toast.success(result.message || "Pledge recorded");
        close(false);
        return;
      }
      setServerError(result?.message || FAILED);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : FAILED);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record a pledge card</DialogTitle>
          <DialogDescription>
            Copy a pledge from a paper card. The giver is found by phone number; give a name if they are new.
          </DialogDescription>
        </DialogHeader>
        <form id="record-pledge-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <PhoneInput name="phoneNumber" register={register} error={errors.phoneNumber} />
          <div className="space-y-2">
            <Label htmlFor="record-pledge-name">Member name</Label>
            <Input id="record-pledge-name" placeholder="Only needed for a new giver" {...register("memberName")} />
            <FieldError message={errors.memberName?.message} />
          </div>
          {fixedCampaignId ? null : <TargetFields control={control} errors={errors} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="record-pledge-amount">
                Amount (KES)<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="record-pledge-amount"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="10000"
                aria-invalid={errors.amount ? true : undefined}
                {...register("amount")}
              />
              <FieldError message={errors.amount?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-pledge-due">Due date (optional)</Label>
              <Input id="record-pledge-due" type="date" {...register("dueDate")} />
            </div>
          </div>
          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="record-pledge-form" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Save pledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
