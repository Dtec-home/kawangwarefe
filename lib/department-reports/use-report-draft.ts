/**
 * useReportDraft (DR-6): loads a department report and autosaves its sections.
 *
 * - Each section is debounced on its own (1.5 s after the last edit); rapid
 *   edits coalesce into one save of the latest value.
 * - Network errors are retried with a capped backoff (`RETRY_DELAYS_MS`);
 *   after the last retry the edit stays unsaved until the next edit or flush.
 * - A `ReportError` result (or a GraphQL error) is not retried: status turns
 *   'error' with the server's message.
 * - While anything is unsaved, leaving the page asks for confirmation.
 * - `flush()` saves at once (the editor calls it when leaving a section); any
 *   pending edits are also sent when the hook unmounts.
 *
 * The editor keeps its own form state; the report returned here follows the
 * Apollo cache, which each save updates (same `DepartmentReport:<id>`).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { skipToken, useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

import {
  GET_DEPARTMENT_REPORT,
  SAVE_REPORT_FINANCIAL_NOTES,
  SAVE_REPORT_ITEMS,
  SAVE_REPORT_LEADERS,
  SAVE_REPORT_TEXT,
  isReportError,
} from "@/lib/graphql/department-reports";
import { ITEM_KIND_BY_SECTION, isListSection } from "@/lib/department-reports/sections";
import type {
  DepartmentReport,
  DepartmentReportDraft,
  DepartmentReportResult,
  FinancialNotesValue,
  ReportItemInput,
  ReportLeaderInput,
  SectionKey,
  SectionValue,
  SectionValueMap,
} from "@/lib/department-reports/types";

export const AUTOSAVE_DEBOUNCE_MS = 1500;

/** Delay before each retry after a network error; its length caps the retries. */
export const RETRY_DELAYS_MS: readonly number[] = [1000, 2000, 4000, 8000, 16000];

export const GIVE_UP_MESSAGE = "Couldn't save. Check your connection; your changes are still on this page.";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface ReportDraftState {
  report: DepartmentReport | null;
  loading: boolean;
  /** Queue a section's new value; it is saved after the debounce. */
  saveSection: <K extends SectionKey>(key: K, value: SectionValueMap[K]) => void;
  /** Save every pending section now. */
  flush: () => Promise<void>;
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  hasUnsaved: boolean;
  /** True while a failed save is waiting for its next retry. */
  retrying: boolean;
  /** Why the last save failed (server message or GIVE_UP_MESSAGE). */
  error: string | null;
  /** `ReportError.code` when the server refused the save. */
  errorCode: string | null;
}

interface PendingEdit {
  value: SectionValue;
  /** Increases with every edit, so a save can tell whether it is still current. */
  edit: number;
}

type Outcome =
  | { kind: "saved" }
  | { kind: "refused"; message: string; code: string | null }
  | { kind: "network" };

export function useReportDraft(reportId: string | null | undefined): ReportDraftState {
  const { data, loading } = useQuery(
    GET_DEPARTMENT_REPORT,
    reportId ? { variables: { id: reportId } } : skipToken,
  );

  const [saveText] = useMutation(SAVE_REPORT_TEXT);
  const [saveItems] = useMutation(SAVE_REPORT_ITEMS);
  const [saveLeaders] = useMutation(SAVE_REPORT_LEADERS);
  const [saveFinancial] = useMutation(SAVE_REPORT_FINANCIAL_NOTES);

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const idRef = useRef(reportId);
  const pending = useRef(new Map<SectionKey, PendingEdit>());
  const timers = useRef(new Map<SectionKey, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(new Set<SectionKey>());
  const rerun = useRef(new Set<SectionKey>());
  const attempts = useRef(new Map<SectionKey, number>());
  const editCounter = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    idRef.current = reportId;
  }, [reportId]);

  const syncUnsaved = useCallback(() => {
    setHasUnsaved(pending.current.size > 0);
  }, []);

  const send = useCallback(
    async (key: SectionKey, value: SectionValue): Promise<DepartmentReportResult<DepartmentReportDraft> | undefined> => {
      const id = idRef.current;
      if (!id) return undefined;
      if (isListSection(key)) {
        const { data: d } = await saveItems({
          variables: { id, kind: ITEM_KIND_BY_SECTION[key], items: value as ReportItemInput[] },
        });
        return d?.saveReportItems;
      }
      if (key === "leaders") {
        const { data: d } = await saveLeaders({ variables: { id, leaders: value as ReportLeaderInput[] } });
        return d?.saveReportLeaders;
      }
      if (key === "financial") {
        const notes = value as FinancialNotesValue;
        const { data: d } = await saveFinancial({ variables: { id, note: notes.note, lineNotes: notes.lineNotes } });
        return d?.saveReportFinancialNotes;
      }
      const { data: d } = await saveText({ variables: { id, section: key, text: value as string } });
      return d?.saveReportText;
    },
    [saveText, saveItems, saveLeaders, saveFinancial],
  );

  // `run` and `schedule` call each other (retries), so both go through refs.
  const runRef = useRef<(key: SectionKey) => Promise<void>>(async () => {});

  const schedule = useCallback((key: SectionKey, delay: number) => {
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key);
        void runRef.current(key);
      }, delay),
    );
  }, []);

  const run = useCallback(
    async (key: SectionKey) => {
      const entry = pending.current.get(key);
      if (!entry) return;
      if (inFlight.current.has(key)) {
        rerun.current.add(key);
        return;
      }

      inFlight.current.add(key);
      setStatus("saving");

      let outcome: Outcome;
      try {
        const result = await send(key, entry.value);
        if (isReportError(result)) {
          outcome = { kind: "refused", message: result.message, code: result.code };
        } else if (result) {
          outcome = { kind: "saved" };
        } else {
          outcome = { kind: "network" };
        }
      } catch (err) {
        outcome = CombinedGraphQLErrors.is(err)
          ? { kind: "refused", message: err.errors[0]?.message ?? err.message, code: null }
          : { kind: "network" };
      } finally {
        inFlight.current.delete(key);
      }

      if (!mounted.current) return;

      if (outcome.kind === "saved") {
        attempts.current.delete(key);
        if (pending.current.get(key)?.edit === entry.edit) pending.current.delete(key);
        setLastSavedAt(new Date());
        setError(null);
        setErrorCode(null);
        setRetrying(false);
        setStatus("saved");
      } else if (outcome.kind === "refused") {
        attempts.current.delete(key);
        setError(outcome.message);
        setErrorCode(outcome.code);
        setRetrying(false);
        setStatus("error");
      } else {
        const tried = attempts.current.get(key) ?? 0;
        setStatus("error");
        setErrorCode(null);
        if (tried < RETRY_DELAYS_MS.length) {
          attempts.current.set(key, tried + 1);
          setRetrying(true);
          setError(null);
          schedule(key, RETRY_DELAYS_MS[tried]);
        } else {
          attempts.current.delete(key);
          setRetrying(false);
          setError(GIVE_UP_MESSAGE);
        }
      }
      syncUnsaved();

      if (rerun.current.delete(key) && pending.current.get(key) && !timers.current.has(key)) {
        await runRef.current(key);
      }
    },
    [send, schedule, syncUnsaved],
  );

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const saveSection = useCallback(
    <K extends SectionKey>(key: K, value: SectionValueMap[K]) => {
      editCounter.current += 1;
      pending.current.set(key, { value, edit: editCounter.current });
      attempts.current.delete(key);
      setHasUnsaved(true);
      schedule(key, AUTOSAVE_DEBOUNCE_MS);
    },
    [schedule],
  );

  const flush = useCallback(async () => {
    const keys = [...pending.current.keys()];
    for (const key of keys) {
      const timer = timers.current.get(key);
      if (timer) clearTimeout(timer);
      timers.current.delete(key);
    }
    await Promise.all(keys.map((key) => runRef.current(key)));
  }, []);

  // Leaving the page with unsaved edits asks for confirmation.
  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsaved]);

  // On unmount (in-app navigation) send what is still pending, once.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    mounted.current = true;
    const timerMap = timers.current;
    const pendingMap = pending.current;
    const inFlightSet = inFlight.current;
    return () => {
      mounted.current = false;
      for (const timer of timerMap.values()) clearTimeout(timer);
      timerMap.clear();
      for (const [key, entry] of pendingMap) {
        if (!inFlightSet.has(key)) sendRef.current(key, entry.value).catch(() => undefined);
      }
    };
  }, []);

  return {
    report: data?.departmentReport ?? null,
    loading,
    saveSection,
    flush,
    status,
    lastSavedAt,
    hasUnsaved,
    retrying,
    error,
    errorCode,
  };
}
