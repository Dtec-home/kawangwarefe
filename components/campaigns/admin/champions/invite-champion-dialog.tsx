/**
 * Invite a member as a champion of a campaign (Fundraising S5, lane S5-UI-J,
 * ticket 5.10): their phone, a code and an optional personal target →
 * inviteChampion. The backend finds the member by phone.
 */

"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { toKenyanMsisdn } from "@/components/campaigns/give/phone";
import {
  CHAMPION_CODE_HINT,
  championCodeError,
  normalizeChampionCode,
  personalTargetError,
} from "@/components/champions/dashboard/champion-display";
import { PhoneInput } from "@/components/forms/phone-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  INVITE_CHAMPION,
  type InviteChampionData,
  type InviteChampionVars,
} from "@/lib/graphql/fundraising/champions";

const schema = z.object({
  phoneNumber: z.string().refine((v) => toKenyanMsisdn(v) !== null, {
    message: "Enter a valid Safaricom or Airtel number",
  }),
  code: z.string().refine((v) => championCodeError(v) === null, { message: CHAMPION_CODE_HINT }),
  personalTarget: z.string().refine((v) => personalTargetError(v) === null, {
    message: "A personal target must be at least KES 1",
  }),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { phoneNumber: "", code: "", personalTarget: "" };
const FAILED = "Could not invite the champion";

/** The mutation variables for a valid form. */
export function toInviteChampionVars(campaignId: string, values: FormValues): InviteChampionVars {
  return {
    campaignId,
    phoneNumber: toKenyanMsisdn(values.phoneNumber)!,
    code: values.code,
    personalTarget: values.personalTarget.trim() || null,
  };
}

interface InviteChampionDialogProps {
  campaignId: string;
  /** The campaign's Pay Bill code, to show the account givers will use. */
  paybillCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

export function InviteChampionDialog({ campaignId, paybillCode, open, onOpenChange, onInvited }: InviteChampionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [invite, { loading }] = useMutation<InviteChampionData, InviteChampionVars>(INVITE_CHAMPION);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  const close = (next: boolean) => {
    if (!next) {
      reset(DEFAULTS);
      setServerError(null);
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { data } = await invite({ variables: toInviteChampionVars(campaignId, values) });
      const result = data?.inviteChampion;
      if (result?.success) {
        toast.success(result.message || "Champion invited");
        close(false);
        onInvited();
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
          <DialogTitle>Invite a champion</DialogTitle>
          <DialogDescription>
            The member is found by their phone number. Their code is added to the campaign&apos;s Pay Bill account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-label="Invite a champion">
          <PhoneInput name="phoneNumber" register={register} error={errors.phoneNumber} />
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="invite-champion-code">
                  Champion code<span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="invite-champion-code"
                  autoComplete="off"
                  maxLength={9}
                  placeholder="JOHN"
                  className="font-mono uppercase"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(normalizeChampionCode(e.target.value))}
                  aria-invalid={errors.code ? true : undefined}
                />
                <p className="text-xs text-muted-foreground">
                  {field.value
                    ? `Givers will use M-Pesa account ${paybillCode} ${field.value}.`
                    : CHAMPION_CODE_HINT}
                </p>
                {errors.code ? <p className="text-sm text-destructive">{errors.code.message}</p> : null}
              </div>
            )}
          />
          <div className="space-y-2">
            <Label htmlFor="invite-champion-target">Personal target (KES, optional)</Label>
            <Input
              id="invite-champion-target"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              placeholder="20000"
              {...register("personalTarget")}
              aria-invalid={errors.personalTarget ? true : undefined}
            />
            {errors.personalTarget ? (
              <p className="text-sm text-destructive">{errors.personalTarget.message}</p>
            ) : null}
          </div>

          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
