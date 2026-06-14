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
    border: "border-l-teal-600 dark:border-l-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
  },
  emerald: {
    border: "border-l-emerald-600 dark:border-l-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    border: "border-l-blue-600 dark:border-l-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    border: "border-l-purple-600 dark:border-l-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
  },
  red: {
    border: "border-l-red-600 dark:border-l-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
  },
  amber: {
    border: "border-l-amber-600 dark:border-l-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
  },
};

// Trend text styling
const getTrendColor = (direction: string) => {
  switch (direction) {
    case "up":
      return "text-green-600 dark:text-green-400";
    case "down":
      return "text-red-600 dark:text-red-400";
    case "neutral":
    default:
      return "text-gray-600 dark:text-gray-400";
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
