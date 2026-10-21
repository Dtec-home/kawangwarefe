/**
 * Guest pledge, step 1: name, phone, amount and an optional due date
 * (S3-UI-E, ticket 3.9). The parent sends them to startGuestPledge.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MessageSquareText } from "lucide-react";

import { toKenyanMsisdn } from "@/components/campaigns/give/phone";
import { PhoneInput } from "@/components/forms/phone-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nairobiToday } from "@/lib/treasury/entry-dates";

export interface GuestPledgeDetails {
  name: string;
  /** 9 local digits as typed, e.g. "712345678". */
  guestPhone: string;
  amount: string;
  /** YYYY-MM-DD or "". */
  dueDate: string;
}

const schema = z.object({
  name: z.string().trim().min(2, { message: "Enter your name" }),
  guestPhone: z.string().refine((v) => toKenyanMsisdn(v) !== null, {
    message: "Enter a valid Safaricom or Airtel number",
  }),
  amount: z.string().refine((v) => Number.parseFloat(v) >= 1, { message: "Amount must be at least KES 1" }),
  dueDate: z.string().refine((v) => !v || v >= nairobiToday(), { message: "The due date cannot be in the past" }),
});

export const EMPTY_GUEST_PLEDGE: GuestPledgeDetails = { name: "", guestPhone: "", amount: "", dueDate: "" };

interface GuestPledgeDetailsFormProps {
  defaultValues: GuestPledgeDetails;
  loading: boolean;
  serverError: string | null;
  onSubmit: (details: GuestPledgeDetails) => void;
}

export function GuestPledgeDetailsForm({ defaultValues, loading, serverError, onSubmit }: GuestPledgeDetailsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestPledgeDetails>({ resolver: zodResolver(schema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-label="Pledge to give later">
      <div className="space-y-2">
        <Label htmlFor="guest-pledge-name">
          Your name<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input
          id="guest-pledge-name"
          autoComplete="name"
          placeholder="Jane Wanjiru"
          className={errors.name ? "border-destructive" : ""}
          {...register("name")}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <PhoneInput name="guestPhone" register={register} error={errors.guestPhone} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="guest-pledge-amount">
            Amount (KES)<span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            id="guest-pledge-amount"
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            placeholder="5000"
            className={errors.amount ? "border-destructive" : ""}
            {...register("amount")}
          />
          {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest-pledge-due-date">Give by (optional)</Label>
          <Input
            id="guest-pledge-due-date"
            type="date"
            min={nairobiToday()}
            className={errors.dueDate ? "border-destructive" : ""}
            {...register("dueDate")}
          />
          {errors.dueDate ? <p className="text-xs text-destructive">{errors.dueDate.message}</p> : null}
        </div>
      </div>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <MessageSquareText className="size-4" />}
        Send me a code
      </Button>
      <p className="text-xs text-muted-foreground">
        We&apos;ll text a 6-digit code to confirm it&apos;s your number.
      </p>
    </form>
  );
}
