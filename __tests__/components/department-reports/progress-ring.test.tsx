import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProgressRing } from "@/components/department-reports/progress-ring";

describe("ProgressRing", () => {
  it("is an image labelled with the count of done sections", () => {
    render(<ProgressRing done={5} total={8} />);
    expect(screen.getByRole("img", { name: "5 of 8 sections done" })).toBeInTheDocument();
    expect(screen.getByText("5/8")).toBeInTheDocument();
  });

  it("draws the arc in proportion", () => {
    const { container } = render(<ProgressRing done={2} total={8} size={40} strokeWidth={4} />);
    const arc = container.querySelector("[data-slot='progress-ring-value']")!;
    const r = (40 - 4) / 2;
    const circumference = 2 * Math.PI * r;
    expect(Number(arc.getAttribute("stroke-dasharray"))).toBeCloseTo(circumference);
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.75);
  });

  it("clamps out-of-range values and copes with total 0", () => {
    render(<ProgressRing done={12} total={8} />);
    expect(screen.getByRole("img", { name: "8 of 8 sections done" })).toBeInTheDocument();
    const { container } = render(<ProgressRing done={0} total={0} />);
    expect(container.querySelector("[data-slot='progress-ring-value']")).toBeInTheDocument();
  });
});
