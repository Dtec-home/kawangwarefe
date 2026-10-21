/**
 * CampaignStkForm — phone + amount → one M-Pesa prompt for the campaign's
 * department, tagged with the campaign (S1-UI-B, ticket 1.12).
 *
 * Given a `championCode` (a champion's page), the prompt carries it so the
 * gift counts towards that champion (S5-UI-I, ticket 5.7).
 *
 * On success it goes to /confirmation with `&campaign=<slug>` so the
 * confirmation page can offer to share the campaign.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PhoneInput } from "@/components/forms/phone-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import {
  INITIATE_CAMPAIGN_CONTRIBUTION,
  type InitiateCampaignContributionData,
  type InitiateCampaignContributionVars,
} from "@/lib/graphql/fundraising/give";
import { toKenyanMsisdn } from "./phone";

const schema = z.object({
  phoneNumber: z.string().refine((v) => toKenyanMsisdn(v) !== null, {
    message: "Enter a valid Safaricom or Airtel number",
  }),
  amount: z.string().refine((v) => Number.parseFloat(v) >= 1, { message: "Amount must be at least KES 1" }),
});

type FormValues = z.infer<typeof schema>;

export interface CampaignStkFormProps {
  slug: string;
  categoryId: string;
  /** The campaign's purpose, so a department's auto-split never splits the gift. */
  purposeId?: string | null;
  campaignId: string;
  /** The champion the gift comes through, if any. */
  championCode?: string | null;
}

/** Confirmation URL for a campaign gift. */
export function campaignConfirmationUrl(contributionId: string, checkoutRequestId: string, slug: string): string {
  const query = new URLSearchParams({ id: contributionId, checkoutRequestId, campaign: slug });
  return `/confirmation?${query.toString()}`;
}

function localPhone(msisdn?: string | null): string {
  const local = msisdn ? toKenyanMsisdn(msisdn) : null;
  return local ? local.slice(3) : "";
}

export function CampaignStkForm({ slug, categoryId, purposeId, campaignId, championCode }: CampaignStkFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [initiate, { loading }] = useMutation<InitiateCampaignContributionData, InitiateCampaignContributionVars>(
    INITIATE_CAMPAIGN_CONTRIBUTION
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: localPhone(user?.phoneNumber), amount: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { data } = await initiate({
        variables: {
          phoneNumber: toKenyanMsisdn(values.phoneNumber)!,
          amount: values.amount,
          categoryId,
          ...(purposeId ? { purposeId } : {}),
          campaignId,
          ...(championCode ? { championCode } : {}),
        },
      });
      const result = data?.initiateContribution;
      if (result?.success && result.contribution?.id) {
        toast.success("M-Pesa prompt sent! Please check your phone.");
        router.push(campaignConfirmationUrl(result.contribution.id, result.checkoutRequestId ?? "", slug));
        return;
      }
      setServerError(result?.message || "Could not send the M-Pesa prompt. Please try again.");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not send the M-Pesa prompt.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <PhoneInput name="phoneNumber" register={register} error={errors.phoneNumber} />
      <div className="space-y-2">
        <Label htmlFor="campaign-amount">
          Amount (KES)<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input
          id="campaign-amount"
          type="number"
          inputMode="decimal"
          min={1}
          step="any"
          placeholder="1000"
          className={errors.amount ? "border-destructive" : ""}
          {...register("amount")}
        />
        {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
      </div>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
        Send M-Pesa prompt
      </Button>
    </form>
  );
}
