/**
 * Pure helpers behind the campaign Statement tab (Fundraising S4, lane S4-UI-G).
 * The backend computes the statement; these only reshape it for display.
 */

import type { StatementPeriod } from "@/lib/graphql/fundraising/statement";
import { receiptChannelLabel } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import type { CampaignProgress, StatementRow } from "@/lib/types/fundraising";

export const ALL_TIME: StatementPeriod = { dateFrom: null, dateTo: null };

const STATEMENT_CHANNEL_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  manual: "Manual",
  cash: "Local Evangelism/Loose Money",
  envelope: "Envelope",
  expense: "Expense",
  payout: "Payout",
};

/** A statement line's channel in plain words. */
export function statementChannelLabel(channel: string): string {
  return STATEMENT_CHANNEL_LABELS[channel] ?? receiptChannelLabel(channel);
}

/** "All time", "From 1 Nov 2026", "Up to 30 Nov 2026" or "1 Nov 2026 – 30 Nov 2026". */
export function describePeriod({ dateFrom, dateTo }: StatementPeriod): string {
  const day = (d: string) => formatEntryDate(d).replace(/^\w+, /, "");
  if (dateFrom && dateTo) return `${day(dateFrom)} – ${day(dateTo)}`;
  if (dateFrom) return `From ${day(dateFrom)}`;
  if (dateTo) return `Up to ${day(dateTo)}`;
  return "All time";
}

/** Why a period cannot be used, or null. Either end may be left open. */
export function periodError({ dateFrom, dateTo }: StatementPeriod): string | null {
  if (dateFrom && dateTo && dateTo < dateFrom) return "The end date must not be before the start date";
  return null;
}

export function toAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Cents-safe addition for display totals. */
function add(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

export interface MoneyInPoint {
  on: string;
  amount: number;
  cumulative: number;
}

/** Money in per day (days with money only), with a running total. Rows come oldest first. */
export function moneyInOverTime(rows: StatementRow[]): MoneyInPoint[] {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const amount = toAmount(r.moneyIn);
    if (amount > 0) byDay.set(r.on, add(byDay.get(r.on) ?? 0, amount));
  }
  let cumulative = 0;
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([on, amount]) => {
      cumulative = add(cumulative, amount);
      return { on, amount, cumulative };
    });
}

export interface ChannelShare {
  channel: string;
  label: string;
  amount: number;
}

/** Money in per channel, largest first. */
export function moneyInByChannel(rows: StatementRow[]): ChannelShare[] {
  const byChannel = new Map<string, number>();
  for (const r of rows) {
    const amount = toAmount(r.moneyIn);
    if (amount > 0) byChannel.set(r.channel, add(byChannel.get(r.channel) ?? 0, amount));
  }
  return [...byChannel.entries()]
    .map(([channel, amount]) => ({ channel, label: statementChannelLabel(channel), amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface PledgeCoverage {
  pledged: number;
  received: number;
  percent: number;
}

/** Received against pledged (all time), or null when nothing is pledged. */
export function pledgeCoverage(
  progress: Pick<CampaignProgress, "pledged" | "raised"> | null | undefined
): PledgeCoverage | null {
  if (!progress) return null;
  const pledged = toAmount(progress.pledged);
  if (pledged <= 0) return null;
  const received = toAmount(progress.raised);
  return { pledged, received, percent: Math.round((received / pledged) * 100) };
}

/** Axis ticks: 0 / 950 / 12.5K / 1.2M. */
export function compactKes(value: number): string {
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (Math.abs(value) >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `${trim(value / 1_000)}K`;
  return String(value);
}

/** "2 Nov" for chart axes; "Sun, 2 Nov 2026" lives in the table. */
export function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}
