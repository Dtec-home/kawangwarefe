"use client";

/** WhatsApp delivery badge for an announcement (AN-1): web only / waiting / posted / failed / not posted. */

import { MessageCircle } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";

export interface AnnouncementWhatsAppFields {
  postToWhatsapp?: boolean | null;
  whatsappStatus?: string | null;
}

type Variant = "success" | "info" | "warning" | "neutral" | "destructive";

export function whatsappStatusLabel(a: AnnouncementWhatsAppFields): string {
  if (!a.postToWhatsapp) return "Web only";
  switch (a.whatsappStatus) {
    case "sent":
      return "Posted to WhatsApp";
    case "failed":
      return "WhatsApp post failed";
    case "skipped":
      return "Not posted to WhatsApp";
    default:
      return "WhatsApp: waiting to post";
  }
}

function variantFor(a: AnnouncementWhatsAppFields): Variant {
  if (!a.postToWhatsapp) return "neutral";
  if (a.whatsappStatus === "sent") return "success";
  if (a.whatsappStatus === "failed") return "destructive";
  if (a.whatsappStatus === "skipped") return "warning";
  return "info";
}

export function AnnouncementWhatsAppStatus({ announcement }: { announcement: AnnouncementWhatsAppFields }) {
  if (announcement.postToWhatsapp === undefined || announcement.postToWhatsapp === null) return null;
  return (
    <StatusBadge variant={variantFor(announcement)} data-testid="announcement-whatsapp-status">
      <MessageCircle className="h-3 w-3" aria-hidden="true" />
      {whatsappStatusLabel(announcement)}
    </StatusBadge>
  );
}
