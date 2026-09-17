/**
 * useActiveEntryUnlocks — open catch-up windows (T2.8).
 *
 * Entries can only be recorded for today unless an admin has opened a
 * catch-up window for a past date. The recorder workspace and manual entry
 * use this to show a "Recording for" selector only while a window is open.
 */

"use client";

import { useQuery } from "@apollo/client/react";
import {
  GET_ACTIVE_ENTRY_DATE_UNLOCKS,
  type ActiveEntryDateUnlocksData,
  type EntryDateUnlock,
} from "@/lib/graphql/treasury-queries";

interface UseActiveEntryUnlocksOptions {
  /** Skip the query (e.g. while the role is unknown or the user can't record) */
  skip?: boolean;
  /** Re-fetch periodically so expired windows drop off (ms) */
  pollInterval?: number;
}

export function useActiveEntryUnlocks({ skip = false, pollInterval }: UseActiveEntryUnlocksOptions = {}) {
  const { data, loading, error, refetch } = useQuery<ActiveEntryDateUnlocksData>(
    GET_ACTIVE_ENTRY_DATE_UNLOCKS,
    {
      skip,
      pollInterval,
      fetchPolicy: "cache-and-network",
    }
  );

  const unlocks: EntryDateUnlock[] = data?.activeEntryDateUnlocks ?? [];

  return {
    unlocks,
    /** Distinct past dates that can currently be recorded for, oldest first */
    unlockDates: Array.from(new Set(unlocks.map((u) => u.unlockDate))).sort(),
    hasActiveUnlocks: unlocks.length > 0,
    loading,
    error,
    refetch,
  };
}

export type { EntryDateUnlock };
