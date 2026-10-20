/**
 * Wording and link for sharing a campaign (lane S2-UI-C, ticket 2.9). The
 * message ends with "online:" because ShareBar appends the page link.
 */

import type { PaymentInstructions } from "@/lib/types/fundraising";
import { safeHttpUrl } from "./campaign-format";

/** The public site address, as in app/layout.tsx's metadataBase. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.sdakawangware.org").replace(/\/+$/, "");

export function campaignShareMessage(
  title: string,
  pay: Pick<PaymentInstructions, "paybillNumber" | "accountReference"> | null | undefined,
): string {
  const lead = `Help us raise funds for ${title}.`;
  if (pay?.paybillNumber && pay.accountReference) {
    return `${lead} Give via M-Pesa Pay Bill ${pay.paybillNumber}, account ${pay.accountReference}, or online:`;
  }
  return `${lead} Give online:`;
}

/** The server's public link, else one built from the site address. */
export function campaignShareUrl({ slug, publicUrl }: { slug: string; publicUrl: string | null | undefined }): string {
  return safeHttpUrl(publicUrl) ?? `${SITE_URL}/campaigns/${encodeURIComponent(slug)}`;
}
