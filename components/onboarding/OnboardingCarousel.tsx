"use client";

/**
 * First-run onboarding carousel (Wave 1 / member parity).
 *
 * A skippable, multi-slide intro overlay shown to first-time members — the
 * web counterpart of the mobile app's intro slides. Slides are data-driven so
 * copy/imagery can change without touching the component (DRY/OCP). The
 * localStorage flag (via `useOnboarding`) guarantees it appears only once.
 */

import { useState } from "react";
import { Sparkles, HandCoins, HeartHandshake, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/hooks/use-onboarding";

interface OnboardingSlide {
  title: string;
  body: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const SLIDES: ReadonlyArray<OnboardingSlide> = [
  {
    title: "Welcome to SDA Kawangware",
    body: "Your church, in your pocket. Stay connected with your community wherever you are.",
    Icon: Sparkles,
  },
  {
    title: "Give with ease",
    body: "Make tithes, offerings, and project contributions securely in just a few taps.",
    Icon: HandCoins,
  },
  {
    title: "Grow together",
    body: "Follow devotionals, request prayer, and keep up with events and announcements.",
    Icon: HeartHandshake,
  },
  {
    title: "Stay in the loop",
    body: "Choose exactly which notifications you receive from your notification preferences.",
    Icon: BellRing,
  },
];

interface OnboardingCarouselProps {
  /** Optional callback fired after the flag is stored (Skip or Get Started). */
  onComplete?: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const { isComplete, complete } = useOnboarding();
  const [index, setIndex] = useState(0);

  // Already onboarded (flag set) — render nothing.
  if (isComplete) return null;

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const { Icon } = slide;

  const finish = () => {
    complete();
    onComplete?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={SLIDES[0].title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow-lg">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4 px-2 py-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-8" />
          </div>
          <h2 className="text-xl font-semibold">{slide.title}</h2>
          <p className="text-sm text-muted-foreground">{slide.body}</p>
        </div>

        {/* Progress dots */}
        <div
          className="flex justify-center gap-2 py-2"
          aria-hidden="true"
        >
          {SLIDES.map((s, i) => (
            <span
              key={s.title}
              className={
                i === index
                  ? "size-2 rounded-full bg-primary"
                  : "size-2 rounded-full bg-muted-foreground/30"
              }
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </Button>
          {isLast ? (
            <Button onClick={finish}>Get Started</Button>
          ) : (
            <Button onClick={() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1))}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
