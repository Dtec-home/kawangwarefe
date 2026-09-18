/**
 * Recorder workspace (T2.5): "Record" | "Today's entries (N)".
 *
 * Mobile-first — used on phones during Sabbath service. Works the same for
 * staff (RR-9) and pure recorders (RR-3..RR-6); the backend enforces access.
 * A collection session banner (T5.3) sits above the tabs.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RecordGiftForm,
  RECORDER_ENTRY_TYPES,
  type RecorderEntryType,
} from "@/components/recorder/record-gift-form";
import { TodaysEntries } from "@/components/recorder/todays-entries";
import { CollectionSessionBanner } from "@/components/recorder/collection-session-banner";
import { useActiveEntryUnlocks } from "@/lib/hooks/use-active-entry-unlocks";
import { useUserRole } from "@/lib/hooks/use-user-role";
import {
  GET_MY_RECORDED_RECEIPTS,
  type MyRecordedReceiptsData,
  type MyRecordedReceiptsVars,
} from "@/lib/graphql/recorder-queries";
import {
  GET_MY_OPEN_COLLECTION_SESSION,
  type MyOpenCollectionSessionData,
} from "@/lib/graphql/collection-session-queries";

const ENTRY_TYPE_STORAGE_KEY = "recorder.entryType";

function readStoredEntryType(): RecorderEntryType {
  if (typeof window === "undefined") return "cash";
  try {
    const stored = window.sessionStorage.getItem(ENTRY_TYPE_STORAGE_KEY);
    if (RECORDER_ENTRY_TYPES.some((t) => t.value === stored)) return stored as RecorderEntryType;
  } catch {
    /* storage unavailable */
  }
  return "cash";
}

export function RecorderWorkspace() {
  const [tab, setTab] = useState("record");
  // Cash/Envelope persists between givers for this browser session. The
  // workspace only renders client-side, behind the role check.
  const [entryType, setEntryTypeState] = useState<RecorderEntryType>(readStoredEntryType);
  const { isPureRecorder } = useUserRole();
  const { unlockDates, hasActiveUnlocks } = useActiveEntryUnlocks({ pollInterval: 60_000 });

  const { data, loading, error, refetch } = useQuery<MyRecordedReceiptsData, MyRecordedReceiptsVars>(
    GET_MY_RECORDED_RECEIPTS,
    { fetchPolicy: "cache-and-network", notifyOnNetworkStatusChange: false }
  );
  const today = data?.myRecordedReceipts;
  const sessionQuery = useQuery<MyOpenCollectionSessionData>(GET_MY_OPEN_COLLECTION_SESSION, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
  });
  const refetchSession = sessionQuery.refetch;

  const setEntryType = (next: RecorderEntryType) => {
    setEntryTypeState(next);
    try {
      window.sessionStorage.setItem(ENTRY_TYPE_STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  const refreshSession = useCallback(() => {
    refetchSession().catch(() => {
      /* the banner hides itself when the session is unavailable */
    });
  }, [refetchSession]);

  // After each save both today's list and the session totals change.
  const refresh = useCallback(() => {
    refetch().catch(() => {
      /* shown by the list's error state */
    });
    refreshSession();
  }, [refetch, refreshSession]);

  // Refresh when the recorder comes back to the tab/app (e.g. after printing).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const changeTab = (next: string) => {
    setTab(next);
    if (next === "today") refresh();
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <PageHeader title="Record giving" description="Cash and envelope gifts, with a receipt for every giver." />
      <CollectionSessionBanner
        session={sessionQuery.data ? sessionQuery.data.myOpenCollectionSession : undefined}
        loading={sessionQuery.loading}
        unavailable={!!sessionQuery.error}
        onChanged={refreshSession}
      />
      <Tabs value={tab} onValueChange={changeTab} className="space-y-4">
        <TabsList className="grid h-11 w-full grid-cols-2">
          <TabsTrigger value="record" className="h-9">
            Record
          </TabsTrigger>
          <TabsTrigger value="today" className="h-9">
            Today&apos;s entries ({today?.count ?? 0})
          </TabsTrigger>
        </TabsList>
        {/* forceMount keeps a half-entered gift when peeking at today's list */}
        <TabsContent value="record" forceMount className="data-[state=inactive]:hidden">
          <RecordGiftForm
            entryType={entryType}
            onEntryTypeChange={setEntryType}
            unlockDates={unlockDates}
            hasActiveUnlocks={hasActiveUnlocks}
            nameOnly={isPureRecorder}
            onRecorded={refresh}
          />
        </TabsContent>
        <TabsContent value="today">
          <TodaysEntries data={today} loading={loading} error={error} onChanged={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
