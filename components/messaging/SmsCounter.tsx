"use client";

/**
 * Live one-SMS counter for anything staff type that goes out by SMS.
 *
 * Shows "118/160" (or "/70" once a non-GSM character is typed), names the
 * characters that cut the limit to 70, and says when name tokens are counted
 * at their longest. Callers block sending while ``countSms(text).fits`` is
 * false; the backend refuses the same messages.
 */

import { countSms, hasNameTokens, TOKEN_ALLOWANCE } from "@/lib/notifications/sms-segments";

interface SmsCounterProps {
  text: string;
  id?: string;
  /** Count against a lower limit than one SMS (e.g. the room an update title has). */
  limit?: number;
}

export function SmsCounter({ text, id, limit }: SmsCounterProps) {
  const count = countSms(text);
  const max = limit !== undefined ? Math.min(limit, count.limit) : count.limit;
  const over = count.length > max;
  const tokens = hasNameTokens(text);
  return (
    <div id={id} className="space-y-1 text-xs" aria-live="polite">
      <p
        data-testid="sms-counter"
        className={over ? "font-medium text-destructive" : "text-muted-foreground"}
      >
        {count.length}/{max} characters{over ? ", more than one SMS" : " (one SMS)"}
      </p>
      {count.nonGsm.length > 0 ? (
        <p data-testid="sms-counter-non-gsm" className="text-warning">
          {count.nonGsm.map((ch) => `"${ch}"`).join(" ")}{" "}
          {count.nonGsm.length === 1 ? "is not a standard SMS character" : "are not standard SMS characters"}, so
          this SMS can only be {count.limit} characters. Replace{" "}
          {count.nonGsm.length === 1 ? "it" : "them"} (for example with a plain &apos; or &quot; or -) to get 160.
        </p>
      ) : null}
      {tokens ? (
        <p className="text-muted-foreground">
          Names are counted at their longest:{" "}
          {Object.entries(TOKEN_ALLOWANCE)
            .map(([token, n]) => `{{${token}}} ${n}`)
            .join(", ")}
          .
        </p>
      ) : null}
      {over ? (
        <p data-testid="sms-counter-over" className="text-destructive">
          Shorten it by {count.length - max} character{count.length - max === 1 ? "" : "s"} to send it as one SMS.
        </p>
      ) : null}
    </div>
  );
}

/** True when ``text`` fits one SMS (and ``limit``, when given). */
export function fitsOneSms(text: string, limit?: number): boolean {
  const count = countSms(text);
  return count.fits && (limit === undefined || count.length <= limit);
}
