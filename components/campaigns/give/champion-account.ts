/**
 * The Pay Bill account for a gift through a champion: the campaign's code and
 * the champion's code, "ROOF JOHN" (account-reference grammar, §4.2;
 * S5-UI-I, ticket 5.7).
 */

import type { PaymentInstructions } from "@/lib/types/fundraising";

/** "ROOF" + "john" → "ROOF JOHN". */
export function championAccountReference(campaignReference: string, championCode: string): string {
  return `${campaignReference.trim()} ${championCode.trim().toUpperCase()}`;
}

/**
 * The campaign's Pay Bill instructions with the champion's account. Used only
 * when the server's champion instructions are not at hand.
 */
export function championPaymentInstructions(
  campaign: PaymentInstructions,
  championCode: string,
): PaymentInstructions {
  const accountReference = championAccountReference(campaign.accountReference, championCode);
  return {
    paybillNumber: campaign.paybillNumber,
    accountReference,
    text: `Pay Bill ${campaign.paybillNumber}, Account ${accountReference}`,
  };
}
