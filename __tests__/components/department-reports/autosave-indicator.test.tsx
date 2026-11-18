import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AutosaveIndicator } from "@/components/department-reports/autosave-indicator";

describe("AutosaveIndicator", () => {
  it("announces changes politely", () => {
    render(<AutosaveIndicator status="idle" />);
    const el = screen.getByTestId("autosave-status");
    expect(el).toHaveAttribute("aria-live", "polite");
    expect(el).toHaveAttribute("role", "status");
    expect(el).toHaveTextContent("");
  });

  it("says Saving…", () => {
    render(<AutosaveIndicator status="saving" />);
    expect(screen.getByTestId("autosave-status")).toHaveTextContent(/^Saving…$/);
  });

  it("says Saved, with the time outside the test id", () => {
    render(<AutosaveIndicator status="saved" lastSavedAt={new Date("2026-11-18T11:05:00Z")} />);
    expect(screen.getByTestId("autosave-status")).toHaveTextContent(/^Saved$/);
    expect(screen.getByText("· 14:05")).toBeInTheDocument();
  });

  it("says Not saved — retrying while the hook retries", () => {
    render(<AutosaveIndicator status="error" retrying />);
    expect(screen.getByTestId("autosave-status")).toHaveTextContent(/^Not saved — retrying$/);
  });

  it("shows the server's reason when it will not retry", () => {
    render(<AutosaveIndicator status="error" retrying={false} error="Introduction is too long" />);
    expect(screen.getByTestId("autosave-status")).toHaveTextContent("Not saved — Introduction is too long");
  });
});
