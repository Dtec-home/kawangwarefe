/**
 * Rows of a pledge register: cards on phones, a table from md up
 * (Fundraising S3, lane S3-UI-F, ticket 3.11).
 */

"use client";

import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import type { Pledge } from "@/lib/types/fundraising";

import { PledgeStatusBadge, isCancellable, pledgeSourceLabel, pledgeTarget } from "./pledge-labels";

interface PledgeTableProps {
  pledges: Pledge[];
  /** Hide the campaign/department column when the register is for one campaign. */
  showTarget: boolean;
  onCancel: (pledge: Pledge) => void;
}

function dueLabel(dueDate: string | null): string {
  return dueDate ? formatEntryDate(dueDate) : "No due date";
}

function CancelButton({ pledge, onCancel }: { pledge: Pledge; onCancel: (pledge: Pledge) => void }) {
  if (!isCancellable(pledge.status)) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-destructive hover:text-destructive"
      aria-label={`Cancel pledge of ${pledge.memberName}`}
      onClick={() => onCancel(pledge)}
    >
      <Ban className="size-4" />
    </Button>
  );
}

export function PledgeTable({ pledges, showTarget, onCancel }: PledgeTableProps) {
  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {pledges.map((pledge) => (
          <li key={pledge.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{pledge.memberName}</p>
                {showTarget && <p className="text-xs text-muted-foreground">{pledgeTarget(pledge)}</p>}
              </div>
              <PledgeStatusBadge status={pledge.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Pledged</p>
                <p className="font-medium">{formatKes(pledge.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p>{formatKes(pledge.paid)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="font-semibold">{formatKes(pledge.balance)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Due {dueLabel(pledge.dueDate)} · {pledgeSourceLabel(pledge.source)}
              </span>
              <CancelButton pledge={pledge} onCancel={onCancel} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 font-medium">Member</th>
              {showTarget && <th className="p-3 font-medium">For</th>}
              <th className="p-3 font-medium text-right">Pledged</th>
              <th className="p-3 font-medium text-right">Paid</th>
              <th className="p-3 font-medium text-right">Balance</th>
              <th className="p-3 font-medium">Due</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pledges.map((pledge) => (
              <tr
                key={pledge.id}
                className={`border-b hover:bg-muted/60 ${pledge.status === "CANCELLED" ? "text-muted-foreground" : ""}`}
              >
                <td className="p-3 font-medium">{pledge.memberName}</td>
                {showTarget && <td className="p-3">{pledgeTarget(pledge)}</td>}
                <td className="p-3 text-right whitespace-nowrap">{formatKes(pledge.amount)}</td>
                <td className="p-3 text-right whitespace-nowrap">{formatKes(pledge.paid)}</td>
                <td className="p-3 text-right font-semibold whitespace-nowrap">{formatKes(pledge.balance)}</td>
                <td className="p-3 whitespace-nowrap">{dueLabel(pledge.dueDate)}</td>
                <td className="p-3">
                  <PledgeStatusBadge status={pledge.status} />
                </td>
                <td className="p-3">{pledgeSourceLabel(pledge.source)}</td>
                <td className="p-3 text-right">
                  <CancelButton pledge={pledge} onCancel={onCancel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
