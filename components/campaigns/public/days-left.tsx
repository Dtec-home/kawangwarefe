/** "12 days left" with a clock; nothing when the campaign has no end date. */

import { Clock } from "lucide-react";
import { daysLeftLabel } from "./campaign-format";
import { cn } from "@/lib/utils";

export function DaysLeft({ daysLeft, className }: { daysLeft: number | null; className?: string }) {
  const label = daysLeftLabel(daysLeft);
  if (!label) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <Clock className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
