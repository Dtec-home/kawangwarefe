/**
 * CampaignClosedNotice — "This campaign has closed", shown on a closed
 * campaign's page and its champion pages. Old links still open, with the
 * final totals; nothing on the page invites another gift.
 */

import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampaignClosedNotice({ action, className }: { action?: ReactNode; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="font-semibold">This campaign has closed</p>
          <p className="text-sm text-muted-foreground">
            Thank you to everyone who gave. These are its final totals.
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}
