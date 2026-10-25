/**
 * Kenyan mobile number normalisation for M-Pesa prompts (S1-UI-B).
 */

/**
 * "0712 345 678", "712345678", "+254712345678" → "254712345678".
 * Returns null unless it is a Kenyan mobile number (07xx / 01xx).
 */
export function toKenyanMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.replace(/^(?:254|0)/, "");
  return /^[17]\d{8}$/.test(local) ? `254${local}` : null;
}
