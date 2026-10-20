/**
 * CampaignCover — the campaign's cover picture, or a quiet teal panel with
 * the church mark when staff left the image out or typed an unusable link.
 */

import { safeHttpUrl } from "./campaign-format";
import { cn } from "@/lib/utils";

interface CampaignCoverProps {
  url: string | null | undefined;
  /** Describes the picture; empty when the title sits next to it anyway. */
  alt?: string;
  className?: string;
  /** Load straight away (the hero), rather than lazily (cards). */
  priority?: boolean;
}

const FALLBACK_STYLE = {
  backgroundColor: "var(--brand-teal-700)",
  backgroundImage:
    "radial-gradient(120% 90% at 100% 0%, var(--brand-teal-500) 0%, transparent 60%), " +
    "radial-gradient(90% 80% at 0% 100%, var(--brand-teal-900) 0%, transparent 70%)",
} as const;

export function CampaignCover({ url, alt = "", className, priority = false }: CampaignCoverProps) {
  const src = safeHttpUrl(url);
  if (src) {
    return (
      // Campaign images are free-form URLs (decision 9), so next/image's
      // remotePatterns cannot list them.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("size-full object-cover", className)}
      />
    );
  }
  return (
    <div
      data-slot="campaign-cover-fallback"
      aria-hidden="true"
      className={cn("relative size-full overflow-hidden", className)}
      style={FALLBACK_STYLE}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark-white.png"
        alt=""
        className="absolute -right-[8%] -bottom-[18%] h-[95%] w-auto opacity-[0.12]"
      />
    </div>
  );
}
