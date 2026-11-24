/**
 * Pure helpers of the leader's report screens (DR-7).
 */
import { describe, expect, it } from "vitest";

import {
  adoptItemIds,
  dueCountdown,
  financialDraftFrom,
  itemRowsFrom,
  moveRow,
  missingReasonLabel,
  previousPeriod,
  reportErrorMessage,
  toItemInputs,
  type ItemRow,
} from "@/components/department-reports/editor/helpers";

import { LAST_PERIOD, OPEN_PERIOD, item, statement } from "./fixtures";

describe("dueCountdown", () => {
  it.each([
    ["2026-12-05", "2026-11-23", "Due in 12 days", "soon"],
    ["2027-07-31", "2026-11-23", "Due in 250 days", "ok"],
    ["2026-11-24", "2026-11-23", "Due tomorrow", "soon"],
    ["2026-11-23", "2026-11-23", "Due today", "soon"],
    ["2026-11-22", "2026-11-23", "1 day overdue", "overdue"],
    ["2026-11-20", "2026-11-23", "3 days overdue", "overdue"],
  ])("due %s seen on %s reads %s", (due, today, label, tone) => {
    expect(dueCountdown(due, today)).toEqual({ label, tone });
  });
});

describe("reportErrorMessage", () => {
  it("maps known codes to friendly sentences", () => {
    expect(reportErrorMessage({ code: "locked", message: "x" })).toMatch(/can't be changed/);
    expect(reportErrorMessage({ code: "incomplete", message: "x" })).toMatch(/still need to be filled in/);
  });

  it("falls back to the server message, then a generic one", () => {
    expect(reportErrorMessage({ code: "brand_new", message: "Server says no." })).toBe("Server says no.");
    expect(reportErrorMessage({ code: "brand_new", message: "" })).toMatch(/Something went wrong/);
  });

  it("labels missing reasons", () => {
    expect(missingReasonLabel({ reason: "required" })).toBe("Not filled in yet");
    expect(missingReasonLabel({ reason: "too_long" })).toBe("Too long");
  });
});

describe("previousPeriod", () => {
  it("is the latest period that started before the current one", () => {
    const older = { ...LAST_PERIOD, id: "1", label: "2024-2025", startDate: "2024-07-01" };
    expect(previousPeriod([older, OPEN_PERIOD, LAST_PERIOD], OPEN_PERIOD)?.label).toBe("2025-2026");
    expect(previousPeriod([OPEN_PERIOD], OPEN_PERIOD)).toBeNull();
  });
});

describe("rows", () => {
  const row = (key: string, text: string, id: string | null = null): ItemRow => ({ key, id, text, fulfilsId: null });

  it("adopts saved ids by position, skipping blank rows", () => {
    const rows = [row("a", "Repair the roof"), row("b", "  "), row("c", "Paint the hall")];
    const saved = [item("11", "objective", 0, "Repair the roof"), item("12", "objective", 1, "Paint the hall")];
    expect(adoptItemIds(rows, saved).map((r) => r.id)).toEqual(["11", null, "12"]);
  });

  it("keeps existing ids and never hands out an id twice", () => {
    const rows = [row("a", "One", "12"), row("b", "Two")];
    const saved = [item("12", "objective", 0, "One"), item("13", "objective", 1, "Two")];
    expect(adoptItemIds(rows, saved).map((r) => r.id)).toEqual(["12", "13"]);
    const clash = [row("a", "One"), row("b", "Two", "11")];
    expect(adoptItemIds(clash, [item("11", "objective", 0, "One")]).map((r) => r.id)).toEqual([null, "11"]);
  });

  it("returns the same array when nothing changes (stable renders)", () => {
    const rows = [row("a", "One", "11")];
    expect(adoptItemIds(rows, [item("11", "objective", 0, "One")])).toBe(rows);
  });

  it("orders saved items and strips the local key for saving", () => {
    const rows = itemRowsFrom(
      [item("2", "objective", 1, "Second"), item("1", "objective", 0, "First"), item("3", "challenge", 0, "No")],
      "objective",
    );
    expect(rows.map((r) => r.text)).toEqual(["First", "Second"]);
    expect(toItemInputs(rows)).toEqual([
      { id: "1", text: "First", fulfilsId: null },
      { id: "2", text: "Second", fulfilsId: null },
    ]);
  });

  it("moves a row up or down and ignores moves past the ends", () => {
    expect(moveRow(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveRow(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveRow(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveRow(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });

  it("keys financial notes by direction and label", () => {
    expect(financialDraftFrom("Narrative", statement())).toEqual({
      note: "Narrative",
      lineNotes: { "in:Roof appeal": "", "in:General": "", "out:Other": "Paint" },
    });
  });
});
