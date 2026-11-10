/**
 * One SMS segment per message (the KES 0.8 Africa's Talking budget).
 *
 * Mirrors the backend rules in church_BE notifications/services/sms_budget.py:
 *  - 160 GSM-7 characters; the extension characters ^ { } \ [ ~ ] | € count 2.
 *  - Any other character (curly quotes ’ “ ”, the dash –, …, emoji, é) turns
 *    the whole SMS into UCS-2, and one segment is then only 70 characters.
 *  - Name tokens count at their longest: {{first_name}} 12, {{last_name}} 15,
 *    {{full_name}} 25 (the backend cuts longer names to these).
 *
 * The alphabet is conservative: letters such as é are in the GSM 03.38 table,
 * but whether a gateway keeps them in GSM-7 cannot be checked, so they count
 * as UCS-2 here too. The counter never under-states the cost.
 */

export const GSM_LIMIT = 160;
export const UCS2_LIMIT = 70;

const GSM_BASIC = new Set(
  "\n !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".split("")
);
const GSM_EXTENSION = new Set("^{}\\[]~|€".split(""));

export const TOKEN_ALLOWANCE: Record<string, number> = {
  first_name: 12,
  last_name: 15,
  full_name: 25,
};

const TOKEN_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

const isGsmChar = (ch: string) => GSM_BASIC.has(ch) || GSM_EXTENSION.has(ch);

/** The distinct characters that would force UCS-2, in order of appearance. */
export function nonGsmChars(text: string): string[] {
  const seen: string[] = [];
  for (const ch of Array.from(text)) {
    if (!isGsmChar(ch) && !seen.includes(ch)) seen.push(ch);
  }
  return seen;
}

/** ``text`` with each known name token replaced by its longest allowed length. */
export function worstCase(text: string): string {
  return text.replace(TOKEN_RE, (match, key: string) =>
    key in TOKEN_ALLOWANCE ? "x".repeat(TOKEN_ALLOWANCE[key]) : match
  );
}

export function hasNameTokens(text: string): boolean {
  return Array.from(text.matchAll(TOKEN_RE)).some((m) => m[1] in TOKEN_ALLOWANCE);
}

export interface SmsCount {
  /** Billable length in the message's encoding. */
  length: number;
  /** The one-segment limit: 160 (GSM-7) or 70 (UCS-2). */
  limit: number;
  encoding: "GSM-7" | "UCS-2";
  segments: number;
  /** Characters that switched the message to UCS-2. */
  nonGsm: string[];
  fits: boolean;
}

/** Count ``text`` (tokens at their longest) as Africa's Talking bills it. */
export function countSms(text: string): SmsCount {
  const worst = worstCase(text);
  const nonGsm = nonGsmChars(worst);
  if (nonGsm.length === 0) {
    let length = 0;
    for (const ch of Array.from(worst)) length += GSM_EXTENSION.has(ch) ? 2 : 1;
    const segments = length <= GSM_LIMIT ? 1 : Math.ceil(length / 153);
    return { length, limit: GSM_LIMIT, encoding: "GSM-7", segments, nonGsm, fits: segments === 1 };
  }
  const length = worst.length; // UTF-16 code units, as UCS-2 bills them
  const segments = length <= UCS2_LIMIT ? 1 : Math.ceil(length / 67);
  return { length, limit: UCS2_LIMIT, encoding: "UCS-2", segments, nonGsm, fits: segments === 1 };
}
