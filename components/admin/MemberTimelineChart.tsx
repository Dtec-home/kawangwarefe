"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

interface ContributionEntry {
  contributionId: string;
  transactionDate: string;
  amount: string;
  entryType: string;
  purposeName: string | null;
  groupName: string | null;
  runningTotal: string;
}

interface Props {
  memberName: string;
  contributions: ContributionEntry[];
  timeBucket: "none" | "monthly";
  onBack?: () => void;
}

const formatKes = (value: number) =>
  value >= 1000 ? `KES ${(value / 1000).toFixed(1)}K` : `KES ${value}`;

const formatDate = (isoDate: string, monthly: boolean) => {
  const d = new Date(isoDate);
  if (monthly) return d.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
};

export function MemberTimelineChart({ memberName, contributions, timeBucket, onBack }: Props) {
  if (contributions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No contribution data for this member
      </div>
    );
  }

  const data = contributions.map((c) => ({
    date: formatDate(c.transactionDate, timeBucket === "monthly"),
    amount: Number(c.amount),
    runningTotal: Number(c.runningTotal),
    entryType: c.entryType,
    purpose: c.purposeName,
    group: c.groupName,
    _raw: c,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    return (
      <div className="bg-background border rounded p-3 text-xs shadow-lg space-y-1">
        <p className="font-semibold">{label}</p>
        <p>Added: <strong>{formatKes(p.amount)}</strong></p>
        <p>Running Total: <strong>{formatKes(p.runningTotal)}</strong></p>
        {p.purpose && <p>Purpose: {p.purpose}</p>}
        {p.group && <p>Group: {p.group}</p>}
        <p className="text-muted-foreground capitalize">{p.entryType.replace("_", " ")}</p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{memberName} — contribution timeline</p>
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            ← Back to all members
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="runningGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatKes} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="stepAfter"
            dataKey="runningTotal"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#runningGrad)"
            dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            name="Running Total"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
