/**
 * Reusable Stat Card Component
 * Used across admin dashboard for consistent statistics display
 * Supports color variants, trend indicators, and mobile responsiveness
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import React from "react";

interface StatCardProps {
  /** Card title/label */
  title: string;

  /** Main value to display (usually a number or amount) */
  value: string | number;

  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;

  /** Color variant for the card */
  color: "teal" | "emerald" | "blue" | "purple" | "red" | "amber";

  /** Optional trend indicator */
  trend?: {
    percentage: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };

  /** Optional subtitle/description below main value */
  subtitle?: string;

  /** Optional className for additional styling */
  className?: string;

  /** Compact, denser layout (smaller padding + value) for above-the-fold grids */
  compact?: boolean;
}

// Color mapping for different stat types
const colorConfig = {
  teal: {
    border: "border-l-primary",
    bg: "bg-[color-mix(in_oklch,var(--primary)_12%,transparent)]",
    text: "text-primary",
  },
  emerald: {
    border: "border-l-[var(--chart-2)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-2)_12%,transparent)]",
    text: "text-[var(--chart-2)]",
  },
  blue: {
    border: "border-l-[var(--chart-3)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-3)_12%,transparent)]",
    text: "text-[var(--chart-3)]",
  },
  purple: {
    border: "border-l-[var(--chart-4)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-4)_12%,transparent)]",
    text: "text-[var(--chart-4)]",
  },
  red: {
    border: "border-l-destructive",
    bg: "bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)]",
    text: "text-destructive",
  },
  amber: {
    border: "border-l-[var(--chart-5)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-5)_12%,transparent)]",
    text: "text-[var(--chart-5)]",
  },
};

// Trend text styling
const getTrendColor = (direction: string) => {
  switch (direction) {
    case "up":
      return "text-[var(--chart-2)]";
    case "down":
      return "text-destructive";
    case "neutral":
    default:
      return "text-muted-foreground";
  }
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  subtitle,
  className = "",
  compact = false,
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <Card className={`border-l-4 ${config.border} ${className}`}>
      <CardHeader
        className={`flex flex-row items-center justify-between space-y-0 ${
          compact ? "pb-1.5" : "pb-3"
        }`}
      >
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-lg ${config.bg} ${compact ? "p-1.5" : "p-2"}`}>
          <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${config.text}`} />
        </div>
      </CardHeader>

      <CardContent>
        {/* Main value */}
        <div className={`${compact ? "text-xl" : "text-2xl"} font-bold`}>{value}</div>

        {/* Trend indicator (optional) */}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 ${getTrendColor(trend.direction)}`}>
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend.direction === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            <span className="text-xs font-medium">
              {Math.abs(trend.percentage)}%
              {trend.label ? ` ${trend.label}` : ""}
            </span>
          </div>
        )}

        {/* Subtitle/description (optional) */}
        {subtitle && (
          <p className={`text-xs ${trend ? "mt-1" : "mt-2"} text-muted-foreground`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
