"use client";

/**
 * The Statement tab's two charts, each with a table twin (dataviz skill):
 *  - Money in over time: one series, cumulative, a step area (money arrives
 *    on a day and stays), so the reader sees the pace of giving.
 *  - Money in by channel: one series of horizontal bars, largest first.
 * Both use the app's accent (--primary, >= 3:1 on the card in both themes),
 * hairline solid grid, text in text tokens, a hover/focus tooltip that never
 * gates a value. A form with nothing to compare (one day, one channel)
 * becomes a sentence instead of a one-mark chart.
 */

import { useId, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import type { StatementRow } from "@/lib/types/fundraising";
import {
  compactKes,
  moneyInByChannel,
  moneyInOverTime,
  shortDate,
  type ChannelShare,
  type MoneyInPoint,
} from "@/components/campaigns/admin/statement/statement-model";

const ACCENT = "var(--primary)";
const GRID = "var(--border)";
const TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

interface ChartFigureProps {
  title: string;
  description: string;
  chart: ReactNode;
  table: ReactNode;
}

/** A titled, described chart that can be swapped for its table. */
function ChartFigure({ title, description, chart, table }: ChartFigureProps) {
  const id = useId();
  const [asTable, setAsTable] = useState(false);
  return (
    <Card>
      <CardContent className="pt-4">
        <figure aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`} className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 id={`${id}-title`} className="text-sm font-medium">
                {title}
              </h3>
              <p id={`${id}-desc`} className="text-xs text-muted-foreground">
                {description}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              aria-pressed={asTable}
              onClick={() => setAsTable((v) => !v)}
            >
              {asTable ? "Show as chart" : "Show as table"}
            </Button>
          </div>
          {asTable ? table : chart}
        </figure>
      </CardContent>
    </Card>
  );
}

interface TipProps {
  active?: boolean;
  payload?: { value?: number | string; payload?: unknown }[];
  heading: (point: never) => string;
  label: string;
}

/** Value first (strong), then what it is; a short line key in the accent. */
function Tip({ active, payload, heading, label }: TipProps) {
  const item = payload?.[0];
  if (!active || !item) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="text-muted-foreground">{heading(item.payload as never)}</p>
      <p className="mt-1 flex items-center gap-2">
        <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ background: ACCENT }} />
        <span className="font-semibold">{formatKes(Number(item.value ?? 0))}</span>
        <span className="text-muted-foreground">{label}</span>
      </p>
    </div>
  );
}

function SimpleTable({ head, rows }: { head: [string, string, string?]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-64 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {head.filter(Boolean).map((h, i) => (
              <th key={h} className={`py-1.5 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells) => (
            <tr key={String(cells[0])} className="border-b last:border-0">
              {cells.map((cell, i) => (
                <td key={i} className={`py-1.5 ${i > 0 ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MoneyInOverTime({ points }: { points: MoneyInPoint[] }) {
  const data = points.map((p) => ({ ...p, t: Date.parse(`${p.on}T00:00:00Z`) }));
  const last = points[points.length - 1];
  return (
    <ChartFigure
      title="Money in over time"
      description={`Running total of money in, reaching ${formatKes(last.cumulative)} on ${formatEntryDate(last.on)}.`}
      chart={
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) => shortDate(new Date(t).toISOString().slice(0, 10))}
                tick={TICK}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                minTickGap={24}
              />
              <YAxis tickFormatter={compactKes} tick={TICK} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                content={(props) => (
                  <Tip
                    {...(props as unknown as TipProps)}
                    label="so far"
                    heading={(p: MoneyInPoint) => `${formatEntryDate(p.on)} · +${formatKes(p.amount)}`}
                  />
                )}
              />
              <Area
                type="stepAfter"
                dataKey="cumulative"
                stroke={ACCENT}
                strokeWidth={2}
                fill={ACCENT}
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 4, fill: ACCENT, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <SimpleTable
          head={["Date", "Money in", "Running total"]}
          rows={points.map((p) => [formatEntryDate(p.on), formatKes(p.amount), formatKes(p.cumulative)])}
        />
      }
    />
  );
}

function MoneyInByChannel({ shares }: { shares: ChannelShare[] }) {
  const height = Math.max(120, shares.length * 40 + 24);
  return (
    <ChartFigure
      title="Money in by channel"
      description={`How the money came in. Largest: ${shares[0].label}, ${formatKes(shares[0].amount)}.`}
      chart={
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shares} layout="vertical" margin={{ top: 4, right: 56, left: 0, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke={GRID} strokeWidth={1} />
              <XAxis type="number" tickFormatter={compactKes} tick={TICK} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={128}
                tick={TICK}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={(props) => (
                  <Tip {...(props as unknown as TipProps)} label="in" heading={(s: ChannelShare) => s.label} />
                )}
              />
              <Bar dataKey="amount" fill={ACCENT} barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList
                  dataKey="amount"
                  position="right"
                  formatter={(v: unknown) => compactKes(Number(v))}
                  style={{ fill: "var(--foreground)", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <SimpleTable head={["Channel", "Money in"]} rows={shares.map((s) => [s.label, formatKes(s.amount)])} />
      }
    />
  );
}

/** One fact in a sentence where a one-mark chart would say nothing more. */
function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}

export function StatementCharts({ rows }: { rows: StatementRow[] }) {
  const points = moneyInOverTime(rows);
  const shares = moneyInByChannel(rows);
  if (points.length === 0) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {points.length > 1 ? (
        <MoneyInOverTime points={points} />
      ) : (
        <Fact title="Money in over time">
          All {formatKes(points[0].amount)} came in on {formatEntryDate(points[0].on)}.
        </Fact>
      )}
      {shares.length > 1 ? (
        <MoneyInByChannel shares={shares} />
      ) : (
        <Fact title="Money in by channel">All money in came through {shares[0].label}.</Fact>
      )}
    </div>
  );
}
