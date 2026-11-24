/**
 * The leader's report editor (DR-7): stepper, each section editor, reorder,
 * carry-forward, the "Fulfils objective" select, the financial table and
 * notes, preview with the missing list, the submit dialog and the returned
 * banner. The view is driven through props; autosave is a spy.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReportEditorView, type EditorDraftApi } from "@/components/department-reports/editor/report-editor";
import type { DepartmentReport, ReportError } from "@/lib/department-reports/types";

import { SERVER_SPECS, comment, completeReport, item, report, statement } from "./fixtures";

function setup(r: DepartmentReport, draftOverrides: Partial<EditorDraftApi> = {}, props: Record<string, unknown> = {}) {
  const draft: EditorDraftApi = {
    saveSection: vi.fn(),
    flush: vi.fn(async () => undefined),
    status: "idle",
    hasUnsaved: false,
    ...draftOverrides,
  };
  const onCarryForward = vi.fn(async (): Promise<ReportError | null> => null);
  const onSubmit = vi.fn(async (): Promise<ReportError | null> => null);
  const onNotify = vi.fn();
  const utils = render(
    <ReportEditorView
      report={r}
      specs={SERVER_SPECS}
      draft={draft}
      previousPeriodLabel="2025-2026"
      onCarryForward={onCarryForward}
      onSubmit={onSubmit}
      onNotify={onNotify}
      {...props}
    />,
  );
  const stepper = () => screen.getByTestId("dept-report-stepper");
  const goTo = (name: string) => fireEvent.click(within(stepper()).getByRole("button", { name }));
  return { ...utils, draft, onCarryForward, onSubmit, onNotify, stepper, goTo, user: userEvent.setup() };
}

describe("stepper", () => {
  it("has one button per section named by the registry title, with the current one marked", () => {
    const { stepper } = setup(report());
    const buttons = within(stepper()).getAllByRole("button");
    expect(buttons.map((b) => b.textContent?.replace(/^\d/, ""))).toEqual(SERVER_SPECS.map((s) => s.title));
    // A new report opens on the first section still missing.
    expect(within(stepper()).getByRole("button", { name: "Introduction / Departmental Mission" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("tells done from missing sections", () => {
    const { stepper } = setup(report());
    expect(within(stepper()).getByRole("button", { name: "Leaders" })).toHaveAccessibleDescription("Done");
    expect(within(stepper()).getByRole("button", { name: "Objectives" })).toHaveAccessibleDescription("Not done yet");
  });

  it("saves pending edits, moves to the section and focuses its heading", () => {
    const { goTo, draft } = setup(report());
    goTo("Conclusion");
    expect(draft.flush).toHaveBeenCalled();
    const heading = screen.getByRole("heading", { level: 2, name: "Conclusion" });
    expect(heading).toHaveFocus();
    expect(within(screen.getByTestId("dept-report-stepper")).getByRole("button", { name: "Conclusion" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("walks through the sections with Next section / Previous", () => {
    setup(report({ missing: [] }));
    expect(screen.getByRole("heading", { level: 2, name: "Introduction / Departmental Mission" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next section/ }));
    expect(screen.getByRole("heading", { level: 2, name: "Leaders" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(screen.getByRole("heading", { level: 2, name: "Introduction / Departmental Mission" })).toBeInTheDocument();
  });
});

describe("text sections", () => {
  it("labels the textarea by the section title, shows the hint, an example and a character counter", () => {
    const { draft } = setup(report());
    const box = screen.getByLabelText("Introduction / Departmental Mission");
    expect(box.tagName).toBe("TEXTAREA");
    expect(screen.getByText(/say why your department exists/)).toBeInTheDocument();
    expect(screen.getByText("For example:")).toBeInTheDocument();
    expect(screen.getByText("0 / 1500 characters")).toBeInTheDocument();
    fireEvent.change(box, { target: { value: "We look after the church buildings." } });
    expect(screen.getByText("35 / 1500 characters")).toBeInTheDocument();
    expect(draft.saveSection).toHaveBeenLastCalledWith("introduction", "We look after the church buildings.");
  });

  it("warns when the text is over the limit and when a required section is left empty", () => {
    const { goTo } = setup(report());
    goTo("Conclusion");
    const box = screen.getByLabelText("Conclusion");
    fireEvent.change(box, { target: { value: "x".repeat(1001) } });
    expect(screen.getByRole("alert")).toHaveTextContent("Keep it under 1000 characters");
    expect(box).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.blur(box);
    expect(screen.getByRole("alert")).toHaveTextContent("Conclusion is required");
  });
});

describe("leaders", () => {
  it("lists the prefilled leaders and saves edits, additions and removals", async () => {
    const { goTo, draft, user } = setup(report());
    goTo("Leaders");
    const list = screen.getByTestId("dept-report-leaders");
    expect(list).toHaveTextContent("Dan Builder");
    expect(screen.getByLabelText("Leader 1 Name")).toHaveValue("Dan Builder");

    await user.click(screen.getByRole("button", { name: "Add leader" }));
    expect(screen.getByLabelText("Leader 2 Name")).toHaveFocus();
    await user.type(screen.getByLabelText("Leader 2 Name"), "Ruth");
    await user.type(screen.getByLabelText("Leader 2 Role"), "Secretary");
    expect(draft.saveSection).toHaveBeenLastCalledWith("leaders", [
      { name: "Dan Builder", roleTitle: "Department leader", phone: "254700000001", memberId: "9" },
      { name: "Ruth", roleTitle: "Secretary", phone: "", memberId: null },
    ]);

    await user.click(screen.getByRole("button", { name: "Move leader number 2 up" }));
    expect(screen.getByLabelText("Leader 1 Name")).toHaveValue("Ruth");
    await user.click(screen.getByRole("button", { name: "Remove leader number 2" }));
    expect(draft.saveSection).toHaveBeenLastCalledWith("leaders", [
      { name: "Ruth", roleTitle: "Secretary", phone: "", memberId: null },
    ]);
  });

  it("says a name is required once the field is left empty", () => {
    const { goTo } = setup(report());
    goTo("Leaders");
    const name = screen.getByLabelText("Leader 1 Name");
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.blur(name);
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });
});

describe("list sections", () => {
  it("adds objectives labelled Objective 1, 2 and saves them in order", async () => {
    const { goTo, draft, user } = setup(report());
    goTo("Objectives");
    expect(screen.getByText("Add at least 1 objective")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add objective" }));
    expect(screen.getByLabelText("Objective 1")).toHaveFocus();
    await user.type(screen.getByLabelText("Objective 1"), "Repair the roof");
    await user.click(screen.getByRole("button", { name: "Add objective" }));
    await user.type(screen.getByLabelText("Objective 2"), "Paint the hall");
    expect(draft.saveSection).toHaveBeenLastCalledWith("objectives", [
      { id: null, text: "Repair the roof", fulfilsId: null },
      { id: null, text: "Paint the hall", fulfilsId: null },
    ]);
    expect(screen.queryByText("Add at least 1 objective")).not.toBeInTheDocument();
  });

  it("reorders with the keyboard and keeps focus on the moved item", async () => {
    const r = report({
      items: [item("11", "objective", 0, "First"), item("12", "objective", 1, "Second"), item("13", "objective", 2, "Third")],
    });
    const { goTo, draft, user } = setup(r);
    goTo("Objectives");
    screen.getByRole("button", { name: "Move objective number 3 up" }).focus();
    await user.keyboard("{Enter}");
    expect(draft.saveSection).toHaveBeenLastCalledWith("objectives", [
      { id: "11", text: "First", fulfilsId: null },
      { id: "13", text: "Third", fulfilsId: null },
      { id: "12", text: "Second", fulfilsId: null },
    ]);
    // The moved item is now number 2; focus followed it.
    expect(screen.getByRole("button", { name: "Move objective number 2 up" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Move objective number 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move objective number 3 down" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Move objective number 1 down" }));
    expect(screen.getByLabelText("Objective 1")).toHaveValue("Third");
  });

  it("removes an item and warns about a blank line", async () => {
    const r = report({ items: [item("11", "challenge", 0, "Transport"), item("12", "challenge", 1, "Rain")] });
    const { goTo, draft, user } = setup(r);
    goTo("Challenges");
    await user.click(screen.getByRole("button", { name: "Remove challenge number 1" }));
    expect(draft.saveSection).toHaveBeenLastCalledWith("challenges", [{ id: "12", text: "Rain", fulfilsId: null }]);
    expect(screen.getByLabelText("Challenge 1")).toHaveFocus();
    await user.clear(screen.getByLabelText("Challenge 1"));
    await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Write something or remove this line");
  });

  it("counts characters per item and flags an item over 500 characters", () => {
    const r = report({ items: [item("11", "recommendation", 0, "Start early")] });
    const { goTo } = setup(r);
    goTo("Recommendations");
    expect(screen.getByText("11 / 500 characters")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Recommendation 1"), { target: { value: "y".repeat(501) } });
    expect(screen.getByRole("alert")).toHaveTextContent("Keep it under 500 characters");
  });

  it("links an achievement to a saved objective through the Fulfils objective select", async () => {
    const r = report({
      items: [
        item("11", "objective", 0, "Repair the roof"),
        item("12", "objective", 1, "Paint the hall"),
        item("21", "achievement", 0, "Roof repaired in March"),
      ],
    });
    const { goTo, draft, user } = setup(r);
    goTo("Achievements");
    const select = screen.getByLabelText(/^Fulfils objective/);
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "—",
      "Repair the roof",
      "Paint the hall",
    ]);
    await user.selectOptions(select, "Repair the roof");
    expect(draft.saveSection).toHaveBeenLastCalledWith("achievements", [
      { id: "21", text: "Roof repaired in March", fulfilsId: "11" },
    ]);
    await user.selectOptions(select, "—");
    expect(draft.saveSection).toHaveBeenLastCalledWith("achievements", [
      { id: "21", text: "Roof repaired in March", fulfilsId: null },
    ]);
  });

  it("asks for objectives first when there are none to link", () => {
    const { goTo } = setup(report());
    goTo("Achievements");
    expect(screen.getByText(/Add objectives first/)).toBeInTheDocument();
  });
});

describe("carry forward", () => {
  const candidates = [item("91", "objective", 0, "Hold a youth camp"), item("92", "objective", 1, "Buy chairs")];

  it("offers last year's objectives as chips and carries the chosen one", async () => {
    const { goTo, draft, onCarryForward, onNotify, user } = setup(report({ carryForwardCandidates: candidates }));
    goTo("Objectives");
    expect(screen.getByText("Carry forward from 2025-2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Carry forward: Hold a youth camp" }));
    expect(draft.flush).toHaveBeenCalled();
    expect(onCarryForward).toHaveBeenCalledWith(["91"]);
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("success", "Objective carried forward"));
  });

  it("can carry them all and marks those already carried", async () => {
    const r = report({
      carryForwardCandidates: [...candidates, item("93", "objective", 2, "Train ushers")],
      items: [item("31", "objective", 0, "Buy chairs", { carriedFromId: "92" })],
    });
    const { goTo, onCarryForward, user } = setup(r);
    goTo("Objectives");
    expect(screen.getByRole("button", { name: "Already carried forward: Buy chairs" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Carry all forward" }));
    expect(onCarryForward).toHaveBeenCalledWith(["91", "93"]);
  });

  it("reports a refused carry-forward", async () => {
    const { goTo, onCarryForward, onNotify, user } = setup(report({ carryForwardCandidates: candidates }));
    onCarryForward.mockResolvedValueOnce({ __typename: "ReportError", code: "too_many_items", message: "", missing: [] });
    goTo("Objectives");
    await user.click(screen.getByRole("button", { name: "Carry forward: Buy chairs" }));
    await waitFor(() =>
      expect(onNotify).toHaveBeenCalledWith("error", "That list has more entries than the template allows."),
    );
  });
});

describe("financial statement", () => {
  it("shows the books' figures read-only in the PDF's order, with KES amounts", () => {
    const { goTo } = setup(report());
    goTo("Financial Statement");
    expect(screen.getByTestId("financial-row-brought-forward")).toHaveTextContent("Balance brought forwardKES 1,000.00");
    expect(screen.getByTestId("financial-row-money-in")).toHaveTextContent("Total money inKES 4,500.00");
    expect(screen.getByTestId("financial-row-money-out")).toHaveTextContent("Total money outKES 1,200.00");
    expect(screen.getByTestId("financial-row-carried-forward")).toHaveTextContent("Balance carried forwardKES 4,300.00");
    const rows = screen.getAllByRole("row").map((r) => r.textContent ?? "");
    const order = ["Balance brought forward", "Money in", "Roof appeal", "General", "Total money in", "Money out", "Other", "Total money out", "Balance carried forward"];
    const positions = order.map((label) => rows.findIndex((text) => text.startsWith(label)));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(screen.getByText(/From the treasurer's books as of 23 Nov 2026, 14:05/)).toBeInTheDocument();
    // No amount can be typed.
    expect(screen.queryByDisplayValue("4500.00")).not.toBeInTheDocument();
  });

  it("saves a note per line and the narrative note", () => {
    const { goTo, draft } = setup(report());
    goTo("Financial Statement");
    expect(screen.getByLabelText("Note for money out: Other")).toHaveValue("Paint");
    fireEvent.change(screen.getByLabelText("Note for money in: Roof appeal"), { target: { value: "Harambee in May" } });
    expect(draft.saveSection).toHaveBeenLastCalledWith("financial", {
      note: "",
      lineNotes: [
        { direction: "in", label: "Roof appeal", note: "Harambee in May" },
        { direction: "in", label: "General", note: "" },
        { direction: "out", label: "Other", note: "Paint" },
      ],
    });
    fireEvent.change(screen.getByLabelText("Note on the money (optional)"), { target: { value: "A good year." } });
    expect(draft.saveSection).toHaveBeenLastCalledWith("financial", expect.objectContaining({ note: "A good year." }));
  });

  it("shows pending requisitions as a note and says when the figures are frozen", () => {
    const { goTo } = setup(
      report({ financial: statement({ pendingRequisitionCount: 2, pendingRequisitionTotal: "800.00", frozen: true }) }),
    );
    goTo("Financial Statement");
    expect(screen.getByTestId("financial-pending")).toHaveTextContent("2 requisitions (KES 800.00) still waiting for approval are not counted");
    expect(screen.getByText(/Frozen on submission/)).toBeInTheDocument();
  });
});

describe("preview & submit", () => {
  it("lists the missing sections as links and keeps Submit report disabled", async () => {
    const { draft, user } = setup(report());
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    expect(draft.flush).toHaveBeenCalled();
    const missing = screen.getByTestId("dept-report-missing");
    for (const title of ["Introduction / Departmental Mission", "Objectives", "Achievements", "Conclusion"]) {
      expect(within(missing).getByRole("link", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Submit report" })).toBeDisabled();
  });

  it("jumps to a missing section from its link", async () => {
    const { user } = setup(report());
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    await user.click(within(screen.getByTestId("dept-report-missing")).getByRole("link", { name: "Objectives" }));
    expect(screen.queryByTestId("dept-report-missing")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Objectives" })).toHaveFocus();
  });

  it("lays the report out like the PDF", async () => {
    const { user } = setup(completeReport());
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    const preview = screen.getByTestId("dept-report-preview");
    expect(within(preview).getByRole("heading", { name: "Building Fund Department Report" })).toBeInTheDocument();
    expect(within(preview).getByText("Period 2026-2027")).toBeInTheDocument();
    expect(within(preview).getByRole("heading", { name: "4. Achievements" })).toBeInTheDocument();
    expect(within(preview).getByText("Fulfils: Repair the roof")).toBeInTheDocument();
  });

  it("waits for unsaved changes before allowing submit", async () => {
    const { user } = setup(completeReport(), { hasUnsaved: true });
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    expect(screen.getByRole("button", { name: "Submit report" })).toBeDisabled();
    expect(screen.getByText(/Saving your latest changes/)).toBeInTheDocument();
  });

  it("confirms once, then submits", async () => {
    const { onSubmit, onNotify, user } = setup(completeReport());
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    await user.click(screen.getByRole("button", { name: "Submit report" }));
    const dialog = screen.getByRole("dialog", { name: "Submit report?" });
    await user.click(within(dialog).getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith("success", "Report submitted. The pastor will review it."));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows a friendly message when the server refuses", async () => {
    const { onSubmit, onNotify, user } = setup(completeReport());
    onSubmit.mockResolvedValueOnce({ __typename: "ReportError", code: "incomplete", message: "x", missing: [] });
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    await user.click(screen.getByRole("button", { name: "Submit report" }));
    await user.click(within(screen.getByRole("dialog", { name: "Submit report?" })).getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onNotify).toHaveBeenCalledWith("error", "Some sections still need to be filled in before you can submit."),
    );
    expect(screen.getByRole("dialog", { name: "Submit report?" })).toBeInTheDocument();
  });

  it("cancelling the dialog does not submit", async () => {
    const { onSubmit, user } = setup(completeReport());
    await user.click(screen.getByRole("button", { name: "Preview & submit" }));
    await user.click(screen.getByRole("button", { name: "Submit report" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("returned reports", () => {
  it("lists the reviewer's comments in a banner and pins each to its section", async () => {
    const r = completeReport({
      status: "returned",
      comments: [comment("achievements", "Please add the roof cost"), comment("conclusion", "Thank the youth too")],
    });
    const { user } = setup(r);
    const banner = screen.getByTestId("dept-report-comments");
    expect(banner).toHaveTextContent("Please add the roof cost");
    expect(banner).toHaveTextContent("Thank the youth too");
    // Opens on the first section with a comment, comment pinned on top.
    expect(screen.getByRole("heading", { level: 2, name: "Achievements" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Please add the roof cost");
    await user.click(within(banner).getByRole("button", { name: "Go to Conclusion" }));
    expect(screen.getByRole("heading", { level: 2, name: "Conclusion" })).toHaveFocus();
    expect(screen.getByRole("note")).toHaveTextContent("Thank the youth too");
  });

  it("shows no banner for a draft", () => {
    setup(report({ comments: [comment("achievements", "Old")] }));
    expect(screen.queryByTestId("dept-report-comments")).not.toBeInTheDocument();
  });
});
