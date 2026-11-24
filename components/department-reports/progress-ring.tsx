/**
 * A small ring showing how many report sections are done (DR-6), e.g. on a
 * "My reports" card: "5 of 8 sections done".
 */

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  done: number;
  total: number;
  /** Diameter in px. */
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({ done, total, size = 44, strokeWidth = 4, className }: ProgressRingProps) {
  const safeTotal = Math.max(0, total);
  const safeDone = Math.min(Math.max(0, done), safeTotal);
  const fraction = safeTotal > 0 ? safeDone / safeTotal : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const complete = safeTotal > 0 && safeDone === safeTotal;

  return (
    <div
      role="img"
      aria-label={`${safeDone} of ${safeTotal} sections done`}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          data-slot="progress-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={cn("transition-[stroke-dashoffset] duration-500", complete ? "stroke-success" : "stroke-primary")}
        />
      </svg>
      <span aria-hidden="true" className="absolute text-[0.65rem] font-semibold tabular-nums text-foreground">
        {safeDone}/{safeTotal}
      </span>
    </div>
  );
}
