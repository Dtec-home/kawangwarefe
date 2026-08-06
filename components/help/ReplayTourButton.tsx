"use client";

/**
 * Shared "Replay tour" trigger for the driver.js element tours.
 *
 * Every page that owns a `useTour()` instance previously hand-rolled its own
 * copy of this button (dashboard, admin overview, contribute) — this is the
 * single shared version. Pages wire in their own `tour.start` / `tour.isReady`
 * from `useTour()`; this component owns only the label/icon/responsive
 * presentation, not the tour logic itself.
 */

import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReplayTourButtonProps {
  /** Starts (or restarts) the page's driver.js tour — typically `tour.start`. */
  onClick: () => void;
  /** Disable while the tour hasn't finished initialising — typically `!tour.isReady`. */
  disabled?: boolean;
  /** Optional className passthrough for layout-specific spacing tweaks. */
  className?: string;
}

export function ReplayTourButton({ onClick, disabled, className }: ReplayTourButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title="Replay tour"
      aria-label="Replay tour"
      className={className}
    >
      <HelpCircle className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Replay tour</span>
    </Button>
  );
}
