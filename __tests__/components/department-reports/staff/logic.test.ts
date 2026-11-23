/**
 * DR-8 pure rules: period form validation (mirrors PeriodService), friendly
 * ReportError wording, tracker filters / overdue counting, the AGM-book gate
 * and the live-vs-frozen comparison (US-15).
 */
import { describe, expect, it } from "vitest";

import {
  formatPeriodDate,
  periodFormValues,
  periodInput,
  validatePeriodForm,
} from "@/components/department-reports/staff/period-form";
import { reportErrorMessage, thrownMessage } from "@/components/department-reports/staff/report-errors";
import {
  canDownloadBook,
  countTrackerRows,
  filterTrackerRows,
  isRowOverdue,
} from "@/components/department-reports/staff/tracker-filters";
import { compareStatements, statementsDiffer, toCents } from "@/components/department-reports/staff/financial-compare";

import { makePeriod, makeRow, makeStatement } from "./fixtures";

const valid = { label: "2025-2026", startDate: "2025-07-01", endDate: "2026-06-30", dueDate: "2026-07-31" };

describe("validatePeriodForm", () => {
  it("accepts start < end <= due", () => {
    expect(validatePeriodForm(valid)).toEqual({});
    expect(validatePeriodForm({ ...valid, dueDate: valid.endDate })).toEqual({});
  });

  it("requires a label and every date", () => {
    expect(validatePeriodForm({ label: "  ", startDate: "", endDate: "", dueDate: "" })).toEqual({
      label: expect.stringContaining("label"),
      startDate: "Choose the start date",
      endDate: "Choose the end date",
      dueDate: "Choose the due date",
    });
  });

  it("limits the label to 20 characters", () => {
    expect(validatePeriodForm({ ...valid, label: "x".repeat(21) }).label).toMatch(/under 21/);
    expect(validatePeriodForm({ ...valid, label: "x".repeat(20) }).label).toBeUndefined();
  });

  it("refuses an end on or before the start", () => {
    expect(validatePeriodForm({ ...valid, endDate: valid.startDate }).endDate).toBe(
      "The end date must be after the start date",
    );
    expect(validatePeriodForm({ ...valid, endDate: "2025-06-01" }).endDate).toBeDefined();
  });

  it("refuses a due date before the end", () => {
    expect(validatePeriodForm({ ...valid, dueDate: "2026-06-29" }).dueDate).toBe(
      "Reports can't be due before the period ends",
    );
  });

  it("prefills from a period and trims the label for the mutation", () => {
    expect(periodFormValues(makePeriod())).toEqual(valid);
    expect(periodFormValues(null)).toEqual({ label: "", startDate: "", endDate: "", dueDate: "" });
    expect(periodInput({ ...valid, label: " 2025-2026 " }).label).toBe("2025-2026");
  });

  it("formats period dates without shifting the day", () => {
    expect(formatPeriodDate("2025-07-01")).toBe("1 Jul 2025");
    expect(formatPeriodDate("bad")).toBe("bad");
  });
});

describe("reportErrorMessage", () => {
  it.each([
    ["period_already_open", /still open/],
    ["invalid_dates", /start before it ends/],
    ["forbidden", /permission/],
    ["comment_required", /what needs to change/],
    ["reason_required", /reason/],
    ["invalid_transition", /Refresh/],
  ])("maps %s to friendly wording", (code, pattern) => {
    expect(reportErrorMessage({ code })).toMatch(pattern);
  });

  it("keeps a specific server message behind invalid_dates (duplicate label)", () => {
    expect(reportErrorMessage({ code: "invalid_dates", message: "A period with that label already exists." })).toBe(
      "A period with that label already exists.",
    );
    expect(
      reportErrorMessage({
        code: "invalid_dates",
        message: "The period must start before it ends, and be due on or after its end.",
      }),
    ).toMatch(/Check the dates/);
  });

  it("falls back to the server message, then the default", () => {
    expect(reportErrorMessage({ code: "weird", message: "Odd thing" })).toBe("Odd thing");
    expect(reportErrorMessage({ code: "weird", message: "" })).toMatch(/Something went wrong/);
    expect(reportErrorMessage(null, "Nope")).toBe("Nope");
  });

  it("words a thrown 'not allowed' error as a permission problem", () => {
    expect(thrownMessage(new Error("You are not allowed to see department reports."), "x")).toMatch(/permission/);
    expect(thrownMessage(new Error("Network down"), "x")).toBe("Network down");
    expect(thrownMessage("boom", "Fallback")).toBe("Fallback");
  });
});

describe("tracker filters", () => {
  const rows = [
    makeRow("Youth", "not_started", { overdue: true }),
    makeRow("Choir", "draft", { overdue: true }),
    makeRow("Welfare", "draft"),
    makeRow("Building Fund", "submitted", { overdue: true }),
    makeRow("Land", "returned"),
    makeRow("Ushers", "approved"),
  ];

  it("counts every chip; overdue only while the report is with the leader", () => {
    expect(countTrackerRows(rows)).toEqual({
      all: 6,
      overdue: 2,
      not_started: 1,
      draft: 2,
      submitted: 1,
      returned: 1,
      approved: 1,
    });
    expect(isRowOverdue(rows[3])).toBe(false);
  });

  it("filters rows by chip", () => {
    expect(filterTrackerRows(rows, "overdue").map((r) => r.department.name)).toEqual(["Youth", "Choir"]);
    expect(filterTrackerRows(rows, "draft")).toHaveLength(2);
    expect(filterTrackerRows(rows, "all")).toHaveLength(6);
  });

  it("allows the AGM book only once something is approved", () => {
    expect(canDownloadBook(rows)).toBe(true);
    expect(canDownloadBook(rows.slice(0, 5))).toBe(false);
    expect(canDownloadBook([])).toBe(false);
  });
});

describe("compareStatements", () => {
  it("flags the lines a late entry changed", () => {
    const frozen = makeStatement();
    const live = makeStatement({ moneyIn: "5500.00", carriedForward: "4500.0", frozen: false });
    const rows = compareStatements(frozen, live);
    expect(rows.map((r) => [r.label, r.changed, r.difference])).toEqual([
      ["Balance brought forward", false, "0.00"],
      ["Money in", true, "500.00"],
      ["Money out", false, "0.00"],
      ["Balance carried forward", true, "500.00"],
    ]);
    expect(statementsDiffer(frozen, live)).toBe(true);
    expect(statementsDiffer(frozen, makeStatement({ moneyIn: "5000.0" }))).toBe(false);
  });

  it("reads bad money as zero", () => {
    expect(toCents("abc")).toBe(0);
    expect(toCents("12.345")).toBe(1235);
  });
});
