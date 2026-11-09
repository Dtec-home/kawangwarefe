/**
 * The channel a contribution came through (W4, decision F6), as recorded by
 * the backend (contributions/channels.py).
 */

const LABELS: Record<string, string> = {
  paybill: "Pay Bill",
  web: "Website",
  app: "Mobile app",
  ussd: "USSD",
  desk: "Desk",
  // An app or website payment recorded before Nov 2026: origin not kept then.
  stk: "App or website",
};

export function channelLabel(channel?: string | null): string {
  return (channel && LABELS[channel]) || "—";
}
