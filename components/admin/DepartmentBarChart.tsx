"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Empty } from "@/components/ui/empty";

interface MemberProgressRow {
  memberId: string;
  memberName: string;
  grandTotal: string;
  contributionCount: number;
  byPurpose: { purposeId: string; purposeName: string; totalAmount: string }[];
  byGroup: { groupId: string | null; groupName: string; totalAmount: string }[];
}

interface Props {
  members: MemberProgressRow[];
  breakdownBy: "none" | "purpose" | "group";
  onMemberClick?: (memberId: string) => void;
}

// Theme chart tokens (defined in globals.css) so bars track the design system
// and adapt to light/dark. Cycles through the 5 available chart slots.
const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const formatKes = (value: number) =>
  value >= 1000 ? `KES ${(value / 1000).toFixed(1)}K` : `KES ${value}`;

export function DepartmentBarChart({ members, breakdownBy, onMemberClick }: Props) {
  if (members.length === 0) {
    return (
      <Empty
        icon={BarChart3}
        title="No data to display"
        description="Member contribution data will appear here once available."
      />
    );
  }

  // Build chart data
  if (breakdownBy === "purpose") {
    // Collect all distinct purposes
    const purposeSet = new Map<string, string>();
    for (const m of members) {
      for (const p of m.byPurpose) purposeSet.set(p.purposeId, p.purposeName);
    }
    const purposes = Array.from(purposeSet.entries());

    const data = members.map((m) => {
      const row: Record<string, string | number> = {
        name: m.memberName.length > 14 ? m.memberName.slice(0, 13) + "…" : m.memberName,
        _memberId: m.memberId,
        _fullName: m.memberName,
      };
      for (const [pid, pname] of purposes) {
        const found = m.byPurpose.find((p) => p.purposeId === pid);
        row[pname] = found ? Number(found.totalAmount) : 0;
      }
      return row;
    });

    const chartWidth = Math.max(members.length * 60, 400);

    return (
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tickFormatter={formatKes} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatKes(value), name]}
                labelFormatter={(label, payload) => payload?.[0]?.payload._fullName ?? label}
              />
              <Legend />
              {purposes.map(([, pname], i) => (
                <Bar
                  key={pname}
                  dataKey={pname}
                  stackId="a"
                  fill={PALETTE[i % PALETTE.length]}
                  onClick={(entry: any) => onMemberClick?.(entry._memberId as string)}
                  style={{ cursor: onMemberClick ? "pointer" : undefined }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (breakdownBy === "group") {
    const groupSet = new Map<string, string>();
    for (const m of members) {
      for (const g of m.byGroup) groupSet.set(g.groupId ?? "top", g.groupName);
    }
    const groups = Array.from(groupSet.entries());

    const data = members.map((m) => {
      const row: Record<string, string | number> = {
        name: m.memberName.length > 14 ? m.memberName.slice(0, 13) + "…" : m.memberName,
        _memberId: m.memberId,
        _fullName: m.memberName,
      };
      for (const [gid, gname] of groups) {
        const found = m.byGroup.find((g) => (g.groupId ?? "top") === gid);
        row[gname] = found ? Number(found.totalAmount) : 0;
      }
      return row;
    });

    const chartWidth = Math.max(members.length * 60, 400);

    return (
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
              <YAxis tickFormatter={formatKes} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatKes(value), name]}
                labelFormatter={(label, payload) => payload?.[0]?.payload._fullName ?? label}
              />
              <Legend />
              {groups.map(([, gname], i) => (
                <Bar
                  key={gname}
                  dataKey={gname}
                  stackId="a"
                  fill={PALETTE[i % PALETTE.length]}
                  onClick={(entry: any) => onMemberClick?.(entry._memberId as string)}
                  style={{ cursor: onMemberClick ? "pointer" : undefined }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Default: single bar per member (breakdownBy = "none")
  const data = members.map((m) => ({
    name: m.memberName.length > 14 ? m.memberName.slice(0, 13) + "…" : m.memberName,
    total: Number(m.grandTotal),
    count: m.contributionCount,
    _memberId: m.memberId,
    _fullName: m.memberName,
  }));

  const chartWidth = Math.max(members.length * 60, 400);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: chartWidth }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
            <YAxis tickFormatter={formatKes} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [formatKes(value), "Total"]}
              labelFormatter={(label, payload) => payload?.[0]?.payload._fullName ?? label}
            />
            <Bar
              dataKey="total"
              radius={[3, 3, 0, 0]}
              onClick={(entry: any) => onMemberClick?.(entry._memberId as string)}
              style={{ cursor: onMemberClick ? "pointer" : undefined }}
            >
              {data.map((entry, i) => (
                <Cell key={entry._memberId} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
