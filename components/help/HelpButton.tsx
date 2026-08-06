"use client";

/**
 * Shared header "Help" menu — mounted once in AdminLayout and once in
 * MemberLayout, next to the existing ThemeToggle/About buttons. Styled to
 * match ThemeToggle's icon-button look (`variant="ghost" size="icon"`).
 *
 * Opens a small dropdown with three destinations: the in-app Help Center
 * (`/help`), WhatsApp support, and email support. Contact details are the
 * single source of truth for the church's support channels — if these ever
 * change, update them here (HelpCenterPage's footer links to the same
 * constants below).
 */

import { useRouter } from "next/navigation";
import { HelpCircle, LifeBuoy, MessageCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Shared support-contact constants — also used by app/(dashboard)/help/page.tsx. */
export const HELP_WHATSAPP_URL = "https://wa.me/254703943726";
export const HELP_EMAIL_ADDRESS = "info@sdakawangware.org";
export const HELP_EMAIL_URL = `mailto:${HELP_EMAIL_ADDRESS}`;

interface HelpButtonProps {
  /** Icon-button size, matching the Button component's size prop. Default: "icon". */
  size?: "icon" | "icon-sm" | "icon-lg" | "icon-mobile";
}

export function HelpButton({ size = "icon" }: HelpButtonProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} className="relative" title="Help">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Help &amp; Support</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/help")}>
          <LifeBuoy className="h-4 w-4 mr-2" />
          Help Center
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(HELP_WHATSAPP_URL, "_blank", "noopener,noreferrer")}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp us
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(HELP_EMAIL_URL, "_self")}>
          <Mail className="h-4 w-4 mr-2" />
          Email us
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
