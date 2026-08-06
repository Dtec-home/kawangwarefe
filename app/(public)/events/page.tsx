"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_EVENTS } from "@/lib/graphql/public-content-queries";
import { Navigation } from "@/components/landing/navigation";
import { EventsSection } from "@/components/landing/events-section";
import { Loader2, ArrowLeft, HeartHandshake, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EventsData {
  events: any[];
}

/** localStorage key for the one-time "Give / Register" callout below — namespaced like the other `cfms_*` flags. */
const EVENTS_TIP_DISMISSED_KEY = "cfms_events_tip_dismissed";

function isTipDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EVENTS_TIP_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function EventsPage() {
  const { loading, data } = useQuery<EventsData>(GET_ALL_EVENTS);

  // `dismissedOverride` is set only by dismissTip() below, for instant
  // same-session feedback; otherwise this defers to the cached localStorage
  // flag read at render time -- no state is ever set from a bare effect
  // (mirrors the read-without-effect convention in lib/hooks/use-onboarding.ts).
  const [dismissedOverride, setDismissedOverride] = useState(false);
  const showTip = !dismissedOverride && !isTipDismissed();

  const dismissTip = () => {
    setDismissedOverride(true);
    try {
      window.localStorage.setItem(EVENTS_TIP_DISMISSED_KEY, "true");
    } catch {
      // localStorage unavailable (e.g. private browsing) -- soft failure, the
      // tip just reappears on the visitor's next visit.
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <div className="container mx-auto px-4 pt-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        {showTip && (
          <div className="container mx-auto px-4 pt-6">
            <div className="max-w-6xl mx-auto">
              <Alert className="relative pr-10">
                <HeartHandshake />
                <AlertDescription>
                  Some events let you give or register right from their card below — look for
                  the &ldquo;Give to this event&rdquo; and &ldquo;Register&rdquo; buttons.
                </AlertDescription>
                <button
                  type="button"
                  onClick={dismissTip}
                  aria-label="Dismiss tip"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Alert>
            </div>
          </div>
        )}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <EventsSection events={data?.events || []} />
        )}
      </main>
    </div>
  );
}
