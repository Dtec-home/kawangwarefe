import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReportStatusBadge } from "@/components/department-reports/status-badge";

describe("ReportStatusBadge", () => {
  it.each([
    ["not_started", "Not started"],
    ["draft", "Draft"],
    ["submitted", "Submitted"],
    ["returned", "Returned"],
    ["approved", "Approved"],
  ] as const)("renders %s as %s", (status, label) => {
    render(<ReportStatusBadge status={status} overdue={false} />);
    expect(screen.getByTestId("dept-report-status")).toHaveTextContent(new RegExp(`^${label}$`));
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("shows Overdue as a separate chip, leaving the label alone", () => {
    render(<ReportStatusBadge status="draft" overdue />);
    expect(screen.getByTestId("dept-report-status")).toHaveTextContent(/^Draft$/);
    expect(screen.getByTestId("dept-report-overdue")).toHaveTextContent("Overdue");
  });

  it("ignores overdue once the report has been handed in", () => {
    render(<ReportStatusBadge status="submitted" overdue />);
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("uses the shared status tokens", () => {
    render(<ReportStatusBadge status="approved" overdue={false} />);
    expect(screen.getByTestId("dept-report-status").className).toContain("text-success");
  });
});
