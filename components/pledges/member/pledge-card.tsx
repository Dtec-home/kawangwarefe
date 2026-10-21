/**
 * One of the member's pledges: target, pledged / paid / balance with a bar,
 * due date (overdue in red), status, "Pay balance" and cancel (S3-UI-E, 3.8).
 */

"use client";

import Link from "next/link";
import { CalendarClock, Wallet } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MyPledge } from "@/lib/graphql/fundraising/member-pledges";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import { cn } from "@/lib/utils";

import {
  canCancelPledge,
  canPayBalance,
  isPledgeOverdue,
  paidPercent,
  payBalanceHref,
  pledgeStatusLabel,
  pledgeStatusVariant,
  pledgeTargetKind,
  pledgeTargetName,
} from "./pledge-display";

interface PledgeCardProps {
  pledge: MyPledge;
  onCancel: (pledge: MyPledge) => void;
}

export function PledgeCard({ pledge, onCancel }: PledgeCardProps) {
  const target = pledgeTargetName(pledge);
  const overdue = isPledgeOverdue(pledge);
  const percent = paidPercent(pledge);

  return (
    <article
      aria-label={`Pledge to ${target}`}
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-5 shadow-sm",
        overdue && "border-destructive/40"
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {pledgeTargetKind(pledge)}
          </p>
          <h2 className="truncate text-lg font-semibold">{target}</h2>
        </div>
        <StatusBadge variant={pledgeStatusVariant(pledge.status)} data-testid="pledge-status">
          {pledgeStatusLabel(pledge.status)}
        </StatusBadge>
      </header>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <Figure label="Pledged" value={formatKes(pledge.amount)} />
        <Figure label="Paid" value={formatKes(pledge.paid)} />
        <Figure label="Balance" value={formatKes(pledge.balance)} strong />
      </dl>

      <Progress
        value={percent}
        aria-label="Paid towards pledge"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-1.5"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          data-testid="pledge-due"
          data-overdue={overdue ? "true" : "false"}
          className={cn(
            "flex items-center gap-1.5 text-sm",
            overdue ? "font-medium text-destructive" : "text-muted-foreground"
          )}
        >
          <CalendarClock className="size-4" aria-hidden="true" />
          {pledge.dueDate ? `Due ${formatEntryDate(pledge.dueDate)}` : "No due date"}
          {overdue ? " · overdue" : null}
        </p>
        <div className="flex flex-wrap gap-2">
          {canCancelPledge(pledge) ? (
            <Button variant="ghost" size="sm" onClick={() => onCancel(pledge)}>
              Cancel pledge
            </Button>
          ) : null}
          {canPayBalance(pledge) ? (
            <Link href={payBalanceHref(pledge)} className={buttonVariants({ size: "sm" })}>
              <Wallet className="size-4" aria-hidden="true" />
              Pay balance
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Figure({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("truncate tabular-nums", strong ? "font-semibold" : "font-medium")}>{value}</dd>
    </div>
  );
}
