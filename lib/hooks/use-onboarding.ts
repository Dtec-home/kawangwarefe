"use client";

/**
 * First-run onboarding state (Wave 1 / member parity; backend-synced in the
 * Help Center foundation work).
 *
 * The backend `TutorialState` model (see `useTour`) is the source of truth,
 * keyed under the tutorial key `onboarding_carousel_v1` — this keeps
 * completion consistent across devices, the same way element-tour progress
 * already is. A localStorage flag is kept as a fast-path cache only, so the
 * carousel doesn't flash open on repeat visits before the backend query
 * resolves; `isComplete` is derived at render time (backend result, once
 * known, always wins over the cache), and the cache is written back to match
 * purely as a side effect — no React state is ever set from the query.
 */

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_TUTORIAL_STATE } from "@/lib/graphql/tutorial-queries";
import { UPDATE_TUTORIAL_STATUS } from "@/lib/graphql/tutorial-mutations";

/** localStorage key — namespaced like the other `cfms_*` flags. */
export const ONBOARDING_STORAGE_KEY = "cfms_onboarding_complete";

/** Backend tutorial key — `_v1` suffix so a future content change can bump
 *  to `_v2` and re-surface the carousel to members who already dismissed v1
 *  (see the tour-config-authoring convention in lib/tours/configs/). */
export const ONBOARDING_TUTORIAL_KEY = "onboarding_carousel_v1";

interface TutorialStateQuery {
  isTutorialCompleted: boolean;
}

function readFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeFlag(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — the backend query is
    // still the source of truth, so this is a soft failure.
  }
}

export function useOnboarding() {
  // Set only by complete()/reset() below, so this session's action is
  // reflected instantly without waiting on a network round-trip. `null`
  // means "no local override yet — defer to the backend / cache".
  const [override, setOverride] = useState<boolean | null>(null);

  const { data } = useQuery<TutorialStateQuery>(GET_TUTORIAL_STATE, {
    variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY },
    errorPolicy: "ignore",
  });
  const backendValue = data?.isTutorialCompleted;

  // Precedence: explicit local action > resolved backend value > cached
  // localStorage flag (read fresh each render — cheap, and only ever used
  // before the backend value is known).
  const isComplete = override ?? backendValue ?? readFlag();

  // Mirror the backend result into the local cache once known. This is a
  // sync-to-external-system effect only — it never calls setState, so a
  // reset elsewhere (e.g. "Replay all tutorials" on the profile page) also
  // clears the stale local flag once this hook next queries the backend.
  useEffect(() => {
    if (backendValue === undefined) return;
    writeFlag(backendValue);
  }, [backendValue]);

  const [markComplete] = useMutation(UPDATE_TUTORIAL_STATUS);

  const complete = useCallback(() => {
    setOverride(true);
    writeFlag(true);
    markComplete({
      variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY, completed: true },
    }).catch((error) => {
      console.warn("Failed to sync onboarding completion to the backend:", error);
    });
  }, [markComplete]);

  const reset = useCallback(() => {
    setOverride(false);
    writeFlag(false);
    markComplete({
      variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY, completed: false },
    }).catch((error) => {
      console.warn("Failed to sync onboarding reset to the backend:", error);
    });
  }, [markComplete]);

  return { isComplete, complete, reset };
}
