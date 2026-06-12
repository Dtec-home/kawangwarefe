"use client";

/**
 * First-run onboarding state (Wave 1 / member parity).
 *
 * Mirrors the mobile app's intro flow: a single localStorage flag records
 * whether the member has seen the welcome carousel, so it only ever appears
 * once. No backend involvement.
 */

import { useCallback, useState } from "react";

/** localStorage key — namespaced like the other `cfms_*` flags. */
export const ONBOARDING_STORAGE_KEY = "cfms_onboarding_complete";

function readFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useOnboarding() {
  // Lazy initialiser reads the flag once on first render (client-side). On the
  // server `readFlag()` returns false, so the overlay is hidden until the
  // client takes over — acceptable for a first-run-only overlay.
  const [isComplete, setIsComplete] = useState<boolean>(readFlag);

  const complete = useCallback(() => {
    setIsComplete(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
  }, []);

  const reset = useCallback(() => {
    setIsComplete(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  return { isComplete, complete, reset };
}
