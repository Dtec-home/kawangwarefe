import * as React from "react"

import { cn } from "@/lib/utils"

export type StatusVariant =
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "neutral"

const STATUS_MAP: Record<string, StatusVariant> = {
  completed: "success",
  complete: "success",
  paid: "success",
  success: "success",
  active: "success",
  approved: "success",
  sent: "success",
  delivered: "success",
  verified: "success",
  pending: "warning",
  processing: "warning",
  draft: "warning",
  queued: "warning",
  scheduled: "warning",
  in_progress: "warning",
  failed: "destructive",
  error: "destructive",
  cancelled: "destructive",
  canceled: "destructive",
  rejected: "destructive",
  declined: "destructive",
  expired: "destructive",
  unmatched: "destructive",
  new: "info",
  info: "info",
  unread: "info",
}

export function statusToVariant(status?: string | null): StatusVariant {
  const key = (status ?? "").toLowerCase().trim()
  return STATUS_MAP[key] ?? "neutral"
}

const STATUS_VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/12 text-info",
  destructive: "bg-destructive/12 text-destructive",
  neutral: "bg-muted text-muted-foreground",
}

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"

export interface StatusBadgeProps
  extends React.ComponentProps<"span"> {
  variant?: StatusVariant
}

export function StatusBadge({
  variant = "neutral",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(PILL_BASE, STATUS_VARIANT_CLASSES[variant], className)}
      {...props}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

export type RoleTone = "primary" | "info" | "warning" | "success" | "neutral"

const ROLE_TONE_CLASSES: Record<RoleTone, string> = {
  primary: "bg-primary/12 text-primary",
  info: "bg-info/12 text-info",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/12 text-success",
  neutral: "bg-muted text-muted-foreground",
}

export interface RoleBadgeProps extends React.ComponentProps<"span"> {
  tone?: RoleTone
}

export function RoleBadge({
  tone = "primary",
  className,
  children,
  ...props
}: RoleBadgeProps) {
  return (
    <span
      data-slot="role-badge"
      className={cn(PILL_BASE, ROLE_TONE_CLASSES[tone], className)}
      {...props}
    >
      {children}
    </span>
  )
}
