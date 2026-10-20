/**
 * ShareBar — share a campaign link on WhatsApp, Facebook, X or SMS, copy it,
 * or use the phone's share sheet (Fundraising S0, shared by every UI lane).
 */

"use client";

import { useSyncExternalStore } from "react";
import { Copy, Facebook, MessageCircle, MessageSquareText, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildShareLinks } from "@/lib/fundraising/share-links";
import { cn } from "@/lib/utils";

interface ShareBarProps {
  url: string;
  text: string;
  title?: string;
  className?: string;
}

const subscribeToNothing = () => () => {};

export function ShareBar({ url, text, title, className }: ShareBarProps) {
  const links = buildShareLinks({ url, text });
  // False on the server; the browser answers whether it has a share sheet.
  const canNativeShare = useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // Dismissing the share sheet rejects; nothing to report.
    }
  };

  const external = { target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <div data-slot="share-bar" className={cn("flex flex-wrap gap-2", className)}>
      <Button asChild variant="outline" size="sm">
        <a href={links.whatsapp} {...external}>
          <MessageCircle className="size-4" /> WhatsApp
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={links.facebook} {...external}>
          <Facebook className="size-4" /> Facebook
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={links.x} {...external} aria-label="X">
          <Twitter className="size-4" /> X
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={links.sms}>
          <MessageSquareText className="size-4" /> SMS
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        <Copy className="size-4" /> Copy link
      </Button>
      {canNativeShare ? (
        <Button type="button" size="sm" onClick={nativeShare}>
          <Share2 className="size-4" /> Share
        </Button>
      ) : null}
    </div>
  );
}
