/**
 * useReportDraft (DR-6): debounced, coalesced autosave per section, retry with
 * capped backoff on network errors, ReportError → status 'error', and a
 * beforeunload guard while anything is unsaved. Fake timers + MockedProvider.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import type { ReactNode } from "react";

import {
  AUTOSAVE_DEBOUNCE_MS,
  RETRY_DELAYS_MS,
  useReportDraft,
} from "@/lib/department-reports/use-report-draft";
import {
  GET_DEPARTMENT_REPORT,
  SAVE_REPORT_ITEMS,
  SAVE_REPORT_TEXT,
} from "@/lib/graphql/department-reports";

const statement = {
  __typename: "FinancialStatement",
  broughtForward: "100.00", moneyIn: "50.00", moneyOut: "20.00", carriedForward: "130.00",
  asOf: "2026-11-18T07:00:00Z", lines: [], frozen: false,
  pendingRequisitionCount: 0, pendingRequisitionTotal: "0.00",
};

function draftFields(overrides: Record<string, unknown> = {}) {
  return {
    __typename: "DepartmentReport",
    id: "5", status: "draft", overdue: false, version: 1,
    introduction: "", conclusion: "", financialNote: "",
    leaders: [], items: [], missing: [], progress: 3,
    canEdit: true, canSubmit: true, canReview: false, canReopen: false,
    ...overrides,
  };
}

const fullReport = {
  ...draftFields(),
  period: {
    __typename: "ReportingPeriod", id: "1", label: "2025-2026",
    startDate: "2025-07-01", endDate: "2026-06-30", dueDate: "2026-07-31", status: "open",
  },
  department: { __typename: "ContributionCategoryType", id: "7", name: "Youth", code: "YOUTH" },
  comments: [], financial: statement, liveFinancial: null, carryForwardCandidates: [],
};

const loadMock: MockedResponse = {
  request: { query: GET_DEPARTMENT_REPORT, variables: { id: "5" } },
  result: { data: { departmentReport: fullReport } },
  delay: 0,
};

function saveText(text: string, result: () => unknown, maxUsageCount = 1): MockedResponse {
  return {
    request: { query: SAVE_REPORT_TEXT, variables: { id: "5", section: "introduction", text } },
    result: result as MockedResponse["result"],
    delay: 0,
    maxUsageCount,
  };
}

const saved = (text: string) => () => ({ data: { saveReportText: draftFields({ introduction: text }) } });

function setup(mocks: MockedResponse[]) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );
  return renderHook(() => useReportDraft("5"), { wrapper });
}

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

/** Let MockLink answer (its observables hop through a few timers). */
const settle = () => advance(50);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useReportDraft", () => {
  it("loads the report", async () => {
    const { result } = setup([loadMock]);
    expect(result.current.report).toBeNull();
    await settle();
    expect(result.current.report?.department.name).toBe("Youth");
    expect(result.current.status).toBe("idle");
    expect(result.current.hasUnsaved).toBe(false);
  });

  it("waits 1.5 s after the last edit, then saves and reports 'saved'", async () => {
    const save = vi.fn(saved("Hello"));
    const { result } = setup([loadMock, saveText("Hello", save)]);
    await settle();

    act(() => result.current.saveSection("introduction", "Hello"));
    expect(result.current.hasUnsaved).toBe(true);
    await advance(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(save).not.toHaveBeenCalled();

    await advance(1);
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
    expect(result.current.hasUnsaved).toBe(false);
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    expect(result.current.report?.introduction).toBe("Hello");
  });

  it("coalesces rapid edits into one save of the latest value", async () => {
    const save = vi.fn(saved("Hel"));
    const { result } = setup([loadMock, saveText("Hel", save)]);
    await settle();

    act(() => result.current.saveSection("introduction", "H"));
    await advance(500);
    act(() => result.current.saveSection("introduction", "He"));
    await advance(500);
    act(() => result.current.saveSection("introduction", "Hel"));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    await settle();

    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
  });

  it("debounces each section on its own and routes lists to saveReportItems", async () => {
    const text = vi.fn(saved("Hi"));
    const items = vi.fn(() => ({
      data: {
        saveReportItems: draftFields({
          items: [{ __typename: "ReportItem", id: "11", kind: "objective", order: 1, text: "Camp", fulfilsId: null, carriedFromId: null }],
        }),
      },
    }));
    const { result } = setup([
      loadMock,
      saveText("Hi", text),
      {
        request: { query: SAVE_REPORT_ITEMS, variables: { id: "5", kind: "objective", items: [{ text: "Camp" }] } },
        result: items as MockedResponse["result"],
        delay: 0,
      },
    ]);
    await settle();

    act(() => result.current.saveSection("introduction", "Hi"));
    act(() => result.current.saveSection("objectives", [{ text: "Camp" }]));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    await settle();

    expect(text).toHaveBeenCalledTimes(1);
    expect(items).toHaveBeenCalledTimes(1);
    expect(result.current.hasUnsaved).toBe(false);
  });

  it("an edit made while a save is in flight is saved after it, never out of order", async () => {
    const first = vi.fn(saved("A"));
    const second = vi.fn(saved("AB"));
    const { result } = setup([
      loadMock,
      { ...saveText("A", first), delay: 3000 },
      saveText("AB", second),
    ]);
    await settle();

    act(() => result.current.saveSection("introduction", "A"));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    act(() => result.current.saveSection("introduction", "AB"));
    await advance(AUTOSAVE_DEBOUNCE_MS); // debounce fires while "A" is still in flight
    expect(second).not.toHaveBeenCalled();
    expect(result.current.hasUnsaved).toBe(true);

    await advance(3000);
    await settle();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(result.current.hasUnsaved).toBe(false);
    expect(result.current.status).toBe("saved");
  });

  it("flush() saves at once (leaving a section)", async () => {
    const save = vi.fn(saved("Now"));
    const { result } = setup([loadMock, saveText("Now", save)]);
    await settle();

    act(() => result.current.saveSection("introduction", "Now"));
    let flushed: Promise<void> = Promise.resolve();
    act(() => {
      flushed = result.current.flush();
    });
    await settle();
    await act(() => flushed);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
  });

  it("retries a network error with backoff, then saves", async () => {
    const save = vi.fn(saved("Hello"));
    const { result } = setup([
      loadMock,
      { request: { query: SAVE_REPORT_TEXT, variables: { id: "5", section: "introduction", text: "Hello" } }, error: new Error("Network down"), delay: 0 },
      saveText("Hello", save),
    ]);
    await settle();

    act(() => result.current.saveSection("introduction", "Hello"));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    await settle();
    expect(result.current.status).toBe("error");
    expect(result.current.retrying).toBe(true);
    expect(result.current.hasUnsaved).toBe(true);
    expect(save).not.toHaveBeenCalled();

    await advance(RETRY_DELAYS_MS[0]);
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
    expect(result.current.retrying).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("gives up after the capped number of retries and keeps the edit unsaved", async () => {
    const attempts = RETRY_DELAYS_MS.length + 1;
    const { result } = setup([
      loadMock,
      {
        request: { query: SAVE_REPORT_TEXT, variables: { id: "5", section: "introduction", text: "Hello" } },
        error: new Error("Network down"), delay: 0, maxUsageCount: attempts,
      },
    ]);
    await settle();

    act(() => result.current.saveSection("introduction", "Hello"));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    for (const delay of RETRY_DELAYS_MS) {
      await settle();
      expect(result.current.retrying).toBe(true);
      await advance(delay);
    }
    await settle();

    expect(result.current.status).toBe("error");
    expect(result.current.retrying).toBe(false);
    expect(result.current.hasUnsaved).toBe(true);
    expect(result.current.error).toMatch(/couldn't save/i);
    expect(RETRY_DELAYS_MS.every((d, i) => i === 0 || d >= RETRY_DELAYS_MS[i - 1])).toBe(true);
    expect(Math.max(...RETRY_DELAYS_MS)).toBeLessThanOrEqual(30_000);
  });

  it("a new edit after giving up starts saving again", async () => {
    const save = vi.fn(saved("Hello again"));
    const { result } = setup([
      loadMock,
      {
        request: { query: SAVE_REPORT_TEXT, variables: { id: "5", section: "introduction", text: "Hello" } },
        error: new Error("Network down"), delay: 0, maxUsageCount: RETRY_DELAYS_MS.length + 1,
      },
      saveText("Hello again", save),
    ]);
    await settle();
    act(() => result.current.saveSection("introduction", "Hello"));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    for (const delay of RETRY_DELAYS_MS) {
      await settle();
      await advance(delay);
    }
    await settle();
    expect(result.current.retrying).toBe(false);

    act(() => result.current.saveSection("introduction", "Hello again"));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
  });

  it("maps a ReportError result to status 'error' with its message, without retrying", async () => {
    const refuse = vi.fn(() => ({
      data: { saveReportText: { __typename: "ReportError", code: "too_long", message: "Introduction is too long", missing: null } },
    }));
    const { result } = setup([loadMock, saveText("x".repeat(2000), refuse, 5)]);
    await settle();

    act(() => result.current.saveSection("introduction", "x".repeat(2000)));
    await advance(AUTOSAVE_DEBOUNCE_MS);
    await settle();
    await advance(60_000);

    expect(refuse).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("error");
    expect(result.current.retrying).toBe(false);
    expect(result.current.error).toBe("Introduction is too long");
    expect(result.current.errorCode).toBe("too_long");
    expect(result.current.hasUnsaved).toBe(true);
  });

  it("guards beforeunload only while something is unsaved", async () => {
    const save = vi.fn(saved("Hello"));
    const { result } = setup([loadMock, saveText("Hello", save)]);
    await settle();

    const fire = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(fire()).toBe(false);
    act(() => result.current.saveSection("introduction", "Hello"));
    expect(fire()).toBe(true);

    await advance(AUTOSAVE_DEBOUNCE_MS);
    await settle();
    expect(result.current.hasUnsaved).toBe(false);
    expect(fire()).toBe(false);
  });

  it("does not query without a report id", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <MockedProvider mocks={[]}>{children}</MockedProvider>;
    const { result } = renderHook(() => useReportDraft(null), { wrapper });
    expect(result.current.report).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
