/**
 * Guest pledge on the public campaign page: details → SMS code → confirmed
 * (S3-UI-E, ticket 3.9). Decision 3: a confirmed guest pledge is active at
 * once. Decision 5: reminders by SMS, 8am–8pm Nairobi time.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CheckCircle2 } from "lucide-react";

import { toKenyanMsisdn } from "@/components/campaigns/give/phone";
import {
  CONFIRM_GUEST_PLEDGE,
  START_GUEST_PLEDGE,
  type ConfirmGuestPledgeData,
  type ConfirmGuestPledgeVars,
  type StartGuestPledgeData,
  type StartGuestPledgeVars,
} from "@/lib/graphql/fundraising/member-pledges";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";

import { GuestPledgeCodeStep } from "./guest-pledge-code-step";
import { EMPTY_GUEST_PLEDGE, GuestPledgeDetailsForm, type GuestPledgeDetails } from "./guest-pledge-details-form";

export const REMINDER_NOTE =
  "We'll remind you by SMS: once a month, 3 days before your due date, and once if it becomes overdue. Reminders are only sent between 8am and 8pm.";

const START_FAILED = "We could not send the code. Please try again.";
const CONFIRM_FAILED = "We could not confirm your pledge. Please try again.";

type Step =
  | { kind: "details" }
  | { kind: "code"; pledgeId: string; notice: string | null }
  | { kind: "done"; message: string };

/** "712345678" → "+254 712 345 678". */
export function displayPhone(local: string): string {
  const msisdn = toKenyanMsisdn(local);
  if (!msisdn) return local;
  const rest = msisdn.slice(3);
  return `+254 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function GuestPledgeFlow({ slug, title }: { slug: string; title: string }) {
  const [details, setDetails] = useState<GuestPledgeDetails>(EMPTY_GUEST_PLEDGE);
  const [step, setStep] = useState<Step>({ kind: "details" });
  const [error, setError] = useState<string | null>(null);
  const [start, { loading: starting }] = useMutation<StartGuestPledgeData, StartGuestPledgeVars>(START_GUEST_PLEDGE);
  const [confirm, { loading: confirming }] = useMutation<ConfirmGuestPledgeData, ConfirmGuestPledgeVars>(
    CONFIRM_GUEST_PLEDGE
  );

  /** Sends (or re-sends) the code; returns the new pledge id, or null with `error` set. */
  const requestCode = async (values: GuestPledgeDetails): Promise<{ pledgeId: string; message: string } | null> => {
    setError(null);
    try {
      const { data } = await start({
        variables: {
          slug,
          name: values.name.trim(),
          phoneNumber: toKenyanMsisdn(values.guestPhone)!,
          amount: values.amount.trim(),
          dueDate: values.dueDate || null,
        },
      });
      const result = data?.startGuestPledge;
      if (result?.success && result.pledgeId) return { pledgeId: result.pledgeId, message: result.message };
      setError(result?.message || START_FAILED);
    } catch (err) {
      setError(errorText(err, START_FAILED));
    }
    return null;
  };

  const submitDetails = async (values: GuestPledgeDetails) => {
    setDetails(values);
    const sent = await requestCode(values);
    if (sent) setStep({ kind: "code", pledgeId: sent.pledgeId, notice: sent.message || null });
  };

  const resend = async () => {
    const sent = await requestCode(details);
    if (sent) setStep({ kind: "code", pledgeId: sent.pledgeId, notice: sent.message || "We sent you a new code." });
  };

  const confirmCode = async (code: string) => {
    if (step.kind !== "code") return;
    setError(null);
    try {
      const { data } = await confirm({ variables: { pledgeId: step.pledgeId, code } });
      const result = data?.confirmGuestPledge;
      if (result?.success) {
        setStep({ kind: "done", message: result.message });
        return;
      }
      setError(result?.message || CONFIRM_FAILED);
    } catch (err) {
      setError(errorText(err, CONFIRM_FAILED));
    }
  };

  if (step.kind === "done") {
    return <PledgeConfirmed details={details} title={title} message={step.message} />;
  }

  if (step.kind === "code") {
    return (
      <GuestPledgeCodeStep
        phoneLabel={displayPhone(details.guestPhone)}
        notice={step.notice}
        error={error}
        confirming={confirming}
        resending={starting}
        onConfirm={confirmCode}
        onResend={resend}
        onChangeDetails={() => {
          setError(null);
          setStep({ kind: "details" });
        }}
      />
    );
  }

  return (
    <GuestPledgeDetailsForm defaultValues={details} loading={starting} serverError={error} onSubmit={submitDetails} />
  );
}

function PledgeConfirmed({ details, title, message }: { details: GuestPledgeDetails; title: string; message: string }) {
  const firstName = details.name.trim().split(/\s+/)[0];
  return (
    <div role="status" className="space-y-3 rounded-xl bg-success/10 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold">Thank you{firstName ? `, ${firstName}` : ""}! Your pledge is confirmed.</p>
          <p className="text-sm">
            {formatKes(details.amount)} to {title}
            {details.dueDate ? `, by ${formatEntryDate(details.dueDate)}` : ""}.
          </p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{REMINDER_NOTE}</p>
    </div>
  );
}
