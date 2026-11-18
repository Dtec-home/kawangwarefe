/**
 * The single status → label/tone mapping used by the badge, tracker and cards (DR-6).
 */
import { describe, it, expect } from "vitest";

import { showOverdue, statusLabel, statusTone } from "@/lib/department-reports/status";

describe("statusLabel", () => {
  it.each([
    ["not_started", "Not started"],
    ["draft", "Draft"],
    ["submitted", "Submitted"],
    ["returned", "Returned"],
    ["approved", "Approved"],
  ])("%s → %s", (status, label) => {
    expect(statusLabel(status)).toBe(label);
  });

  it("never turns overdue into a label (it is a separate chip)", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("not_started")).toBe("Not started");
  });

  it("falls back to a readable label for an unknown status", () => {
    expect(statusLabel("in_review")).toBe("In review");
  });
});

describe("statusTone", () => {
  it.each([
    ["not_started", "neutral"],
    ["draft", "info"],
    ["submitted", "warning"],
    ["returned", "destructive"],
    ["approved", "success"],
    ["mystery", "neutral"],
  ])("%s → %s", (status, tone) => {
    expect(statusTone(status)).toBe(tone);
  });

  it("an overdue report that is still with the leader turns destructive", () => {
    expect(statusTone("draft", true)).toBe("destructive");
    expect(statusTone("not_started", true)).toBe("destructive");
  });

  it("overdue never changes submitted or approved", () => {
    expect(statusTone("submitted", true)).toBe("warning");
    expect(statusTone("approved", true)).toBe("success");
  });
});

describe("showOverdue", () => {
  it("shows the chip only while the report is still with the leader", () => {
    expect(showOverdue("draft", true)).toBe(true);
    expect(showOverdue("returned", true)).toBe(true);
    expect(showOverdue("not_started", true)).toBe(true);
    expect(showOverdue("submitted", true)).toBe(false);
    expect(showOverdue("approved", true)).toBe(false);
    expect(showOverdue("draft", false)).toBe(false);
  });
});
