import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReviewHistory } from "@/components/department-reports/editor/review-comments";
import { DEFAULT_SECTION_SPECS } from "@/lib/department-reports/sections";
import type { ReportComment } from "@/lib/department-reports/types";

const comment = (over: Partial<ReportComment> = {}): ReportComment => ({
  sectionKey: "challenges",
  body: "Please mention the delay in getting roofing materials.",
  author: "Paul Pastor",
  createdAt: "2026-11-24T16:01:00Z",
  resolved: false,
  ...over,
});

describe("ReviewHistory (reviewer sees what they asked for)", () => {
  it("lists every comment with its section title and author", () => {
    render(<ReviewHistory comments={[comment()]} specs={DEFAULT_SECTION_SPECS} expanded />);
    const panel = screen.getByTestId("dept-report-review-history");
    expect(panel).toHaveTextContent("Comments sent to the leader");
    expect(panel).toHaveTextContent("Challenges");
    expect(panel).toHaveTextContent("Please mention the delay in getting roofing materials.");
    expect(panel).toHaveTextContent("Paul Pastor");
  });

  it("marks comments resolved once the report was approved", () => {
    render(<ReviewHistory comments={[comment({ resolved: true })]} specs={DEFAULT_SECTION_SPECS} expanded={false} />);
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("renders nothing without comments", () => {
    const { container } = render(<ReviewHistory comments={[]} specs={DEFAULT_SECTION_SPECS} expanded />);
    expect(container).toBeEmptyDOMElement();
  });
});
