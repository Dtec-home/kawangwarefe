/**
 * ReportPreview (DR-7; reused read-only by DR-8): laid out like the PDF.
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ReportPreview } from "@/components/department-reports/report-preview";

import { SERVER_SPECS, completeReport, item, report, statement } from "./editor/fixtures";

describe("ReportPreview", () => {
  it("has the PDF title, period and the eight numbered sections in order", () => {
    render(<ReportPreview report={completeReport()} specs={SERVER_SPECS} />);
    expect(screen.getByRole("heading", { level: 2, name: "Building Fund Department Report" })).toBeInTheDocument();
    expect(screen.getByText("Period 2026-2027")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "1. Introduction / Departmental Mission",
      "2. Leaders",
      "3. Objectives",
      "4. Achievements",
      "5. Challenges",
      "6. Recommendations",
      "7. Financial Statement",
      "8. Conclusion",
    ]);
  });

  it("shows the content of each section, with achievements linked to objectives", () => {
    render(<ReportPreview report={completeReport()} specs={SERVER_SPECS} />);
    expect(screen.getByText("We look after the church buildings.")).toBeInTheDocument();
    expect(screen.getByText("Dan Builder")).toBeInTheDocument();
    expect(screen.getByText("Department leader · 254700000001")).toBeInTheDocument();
    expect(screen.getByText("Repair the roof")).toBeInTheDocument();
    expect(screen.getByText("Fulfils: Repair the roof")).toBeInTheDocument();
    expect(screen.getAllByText("None listed.")).toHaveLength(2); // challenges, recommendations
    expect(screen.getByTestId("financial-row-money-in")).toHaveTextContent("KES 4,500.00");
    expect(screen.getByText("Paint")).toBeInTheDocument(); // a line note
  });

  it("marks empty required sections and says whether the money is frozen", () => {
    const { rerender } = render(<ReportPreview report={report()} specs={SERVER_SPECS} />);
    expect(screen.getAllByText("Not filled in yet.")).toHaveLength(2); // introduction, conclusion
    expect(screen.getByText(/From the treasurer's books as of/)).toBeInTheDocument();
    rerender(<ReportPreview report={report({ financial: statement({ frozen: true }) })} specs={SERVER_SPECS} />);
    expect(screen.getByText(/Frozen on submission as of/)).toBeInTheDocument();
  });

  it("is read-only and never shows a status badge", () => {
    render(<ReportPreview report={completeReport({ items: [item("11", "objective", 0, "Repair the roof")] })} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dept-report-status")).not.toBeInTheDocument();
  });

  it("lets a reviewer add content under each section heading", () => {
    render(
      <ReportPreview
        report={completeReport()}
        specs={SERVER_SPECS}
        renderSectionExtras={(spec) => <span data-testid={`extra-${spec.key}`}>extra</span>}
      />,
    );
    const section = document.getElementById("preview-section-achievements")!;
    expect(within(section).getByTestId("extra-achievements")).toBeInTheDocument();
  });
});
