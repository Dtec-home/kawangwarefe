/**
 * Web binding for `department-reports/leader_writing.feature` (DR-7).
 *
 * "My reports" and the autosave scenario render the real screens against
 * Apollo's MockedProvider with the production documents; the editor scenarios
 * drive ReportEditorView with an autosave spy, so each step checks exactly
 * what would be sent to the server.
 */

import { defineFeature, loadFeature } from "jest-cucumber";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import { afterEach, expect, vi } from "vitest";
import type { ReactNode } from "react";

const { push, toast } = vi.hoisted(() => ({ push: vi.fn(), toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("sonner", () => ({ toast }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/department-reports",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => ({ isStaff: false, isAdmin: false }) }));
vi.mock("@/components/department-reports/staff/report-actions", () => ({ ReportActions: () => null }));

import { MyReports } from "@/components/department-reports/editor/my-reports";
import { ReportEditorView, type EditorDraftApi } from "@/components/department-reports/editor/report-editor";
import { ReportPage } from "@/components/department-reports/editor/report-page";
import type { DepartmentReport, ReportError, ReportingPeriod, SectionKey } from "@/lib/department-reports/types";
import {
  GET_DEPARTMENT_REPORT,
  GET_MY_DEPARTMENT_REPORTS,
  GET_REPORTING_PERIODS,
  GET_REPORT_SECTION_SPECS,
  SAVE_REPORT_TEXT,
  START_DEPARTMENT_REPORT,
} from "@/lib/graphql/department-reports";

import {
  OPEN_PERIOD,
  SERVER_SPECS,
  comment,
  completeReport,
  draftFields,
  item,
  report as makeReport,
  specsWithTypename,
  trackerRow,
} from "../../components/department-reports/editor/fixtures";

const feature = loadFeature("./leader_writing.feature", { loadRelativePath: true });

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  push.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

// ── Helpers ──────────────────────────────────────────────────────────────

function withApollo(mocks: MockedResponse[], ui: ReactNode) {
  return render(<MockedProvider mocks={mocks}>{ui}</MockedProvider>);
}

interface Editor {
  draft: EditorDraftApi & { saveSection: ReturnType<typeof vi.fn> };
  onCarryForward: ReturnType<typeof vi.fn>;
  onSubmit: ReturnType<typeof vi.fn>;
}

function openEditor(r: DepartmentReport, previousPeriodLabel: string | null = null): Editor {
  const draft = { saveSection: vi.fn(), flush: vi.fn(async () => undefined), status: "idle", hasUnsaved: false } as Editor["draft"];
  const onCarryForward = vi.fn(async (): Promise<ReportError | null> => null);
  const onSubmit = vi.fn(async (): Promise<ReportError | null> => null);
  render(
    <ReportEditorView
      report={r}
      specs={SERVER_SPECS}
      draft={draft}
      previousPeriodLabel={previousPeriodLabel}
      onCarryForward={onCarryForward}
      onSubmit={onSubmit}
      onNotify={(kind, message) => toast[kind](message)}
    />,
  );
  return { draft, onCarryForward, onSubmit };
}

const goToSection = (title: string) =>
  fireEvent.click(within(screen.getByTestId("dept-report-stepper")).getByRole("button", { name: title }));

function lastSaved(editor: Editor, key: SectionKey) {
  const calls = editor.draft.saveSection.mock.calls.filter(([k]) => k === key);
  return calls[calls.length - 1]?.[1];
}

async function previewAndSubmit() {
  fireEvent.click(screen.getByRole("button", { name: "Preview & submit" }));
  const submit = await screen.findByRole("button", { name: "Submit report" });
  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  fireEvent.click(within(screen.getByRole("dialog", { name: "Submit report?" })).getByRole("button", { name: "Submit" }));
}

const periodWith = (label: string, due: string): ReportingPeriod => ({ ...OPEN_PERIOD, label, dueDate: due });

// ── Scenarios ────────────────────────────────────────────────────────────

defineFeature(feature, (test) => {
  test("The leader sees the report to write, its status and due date (US-2)", ({ given, and, when, then }) => {
    let period = OPEN_PERIOD;
    given(/^the period "(.*)" is open and due "(.*)"$/, (label: string, due: string) => {
      period = periodWith(label, due);
    });
    and(/^today is "(.*)"$/, (today: string) => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(`${today}T09:00:00+03:00`));
    });
    when("the Building Fund leader opens Department Reports", () => {
      withApollo(
        [
          { request: { query: GET_REPORTING_PERIODS }, result: { data: { reportingPeriods: [period] } } },
          {
            request: { query: GET_MY_DEPARTMENT_REPORTS, variables: { periodId: null } },
            result: { data: { myDepartmentReports: [trackerRow()] } },
          },
        ],
        <MyReports />,
      );
    });
    then(/^the "(.*)" card shows the period "(.*)" as "(.*)"$/, async (dept: string, label: string, status: string) => {
      const card = await screen.findByTestId("dept-report-card");
      expect(card).toHaveTextContent(dept);
      expect(card).toHaveTextContent(`Period ${label}`);
      expect(within(card).getByTestId("dept-report-status")).toHaveTextContent(status);
    });
    and(/^the card says "(.*)"$/, (text: string) => {
      expect(screen.getByTestId("dept-report-card")).toHaveTextContent(text);
    });
  });

  test("Starting a report opens it with the leaders filled in (US-3)", ({ given, when, then, and }) => {
    let period = OPEN_PERIOD;
    given(/^the period "(.*)" is open and due "(.*)"$/, (label: string, due: string) => {
      period = periodWith(label, due);
    });
    when(/^the Building Fund leader starts the "(.*)" report$/, async () => {
      withApollo(
        [
          { request: { query: GET_REPORTING_PERIODS }, result: { data: { reportingPeriods: [period] } } },
          {
            request: { query: GET_MY_DEPARTMENT_REPORTS, variables: { periodId: null } },
            result: { data: { myDepartmentReports: [trackerRow()] } },
          },
          {
            request: { query: START_DEPARTMENT_REPORT, variables: { periodId: period.id, departmentId: "7" } },
            result: { data: { startDepartmentReport: makeReport() } },
          },
        ],
        <MyReports />,
      );
      fireEvent.click(await screen.findByRole("button", { name: "Start report" }));
    });
    then(/^the editor for report "(.*)" opens$/, async (id: string) => {
      await waitFor(() => expect(push).toHaveBeenCalledWith(`/admin/department-reports/${id}`));
      cleanup();
      openEditor(makeReport());
    });
    and(/^the leaders section lists "(.*)"$/, (name: string) => {
      goToSection("Leaders");
      expect(screen.getByTestId("dept-report-leaders")).toHaveTextContent(name);
    });
  });

  test("Last year's objectives can be carried forward (US-3)", ({ given, when, and, then }) => {
    let editor: Editor;
    given(/^a draft report with last year's objective "(.*)" from "(.*)"$/, (text: string, label: string) => {
      editor = openEditor(makeReport({ carryForwardCandidates: [item("91", "objective", 0, text)] }), label);
    });
    when("the leader opens the Objectives section", () => {
      goToSection("Objectives");
      expect(screen.getByText("Carry forward from 2025-2026")).toBeInTheDocument();
    });
    and(/^the leader carries forward "(.*)"$/, (text: string) => {
      fireEvent.click(screen.getByRole("button", { name: `Carry forward: ${text}` }));
    });
    then(/^the objective "(.*)" is carried forward$/, async () => {
      await waitFor(() => expect(editor.onCarryForward).toHaveBeenCalledWith(["91"]));
      expect(editor.draft.flush).toHaveBeenCalled();
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Objective carried forward"));
    });
  });

  test("Every section shows the template hint (US-4)", ({ given, when, then, and }) => {
    let editor: Editor;
    given("a freshly started draft report", () => {
      editor = openEditor(makeReport());
    });
    when(/^the leader opens the "(.*)" section$/, (title: string) => {
      goToSection(title);
      expect(screen.getByRole("heading", { level: 2, name: title })).toHaveFocus();
    });
    then(/^the section shows the hint "(.*)"$/, (hint: string) => {
      expect(screen.getByText(hint)).toBeInTheDocument();
    });
    and(/^the leader adds the challenge "(.*)"$/, (text: string) => {
      fireEvent.click(screen.getByRole("button", { name: "Add challenge" }));
      fireEvent.change(screen.getByLabelText("Challenge 1"), { target: { value: text } });
    });
    then(/^the challenges saved are "(.*)"$/, (text: string) => {
      expect(lastSaved(editor, "challenges")).toEqual([{ id: null, text, fulfilsId: null }]);
    });
  });

  test("Writing a section is saved automatically (US-5)", ({ given, when, then, and }) => {
    const text = "We look after the church buildings.";
    given("the leader is editing a freshly started report", async () => {
      const r = makeReport();
      withApollo(
        [
          { request: { query: GET_DEPARTMENT_REPORT, variables: { id: "5" } }, result: { data: { departmentReport: r } }, maxUsageCount: 3 },
          { request: { query: GET_REPORT_SECTION_SPECS }, result: { data: { reportSectionSpecs: specsWithTypename } } },
          {
            request: { query: SAVE_REPORT_TEXT, variables: { id: "5", section: "introduction", text } },
            result: {
              data: { saveReportText: { ...draftFields(r), introduction: text, missing: r.missing.slice(1), progress: 5 } },
            },
          },
        ],
        <ReportPage reportId="5" />,
      );
      await screen.findByLabelText("Introduction / Departmental Mission");
    });
    when(/^the leader writes the introduction "(.*)"$/, async (value: string) => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fireEvent.change(screen.getByLabelText("Introduction / Departmental Mission"), { target: { value } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1600);
      });
      vi.useRealTimers();
    });
    then("the report says it is saved", async () => {
      await waitFor(() => expect(screen.getByTestId("autosave-status")).toHaveTextContent("Saved"));
    });
    and(/^(\d+) of (\d+) sections are done$/, async (done: string, total: string) => {
      await waitFor(() => expect(screen.getByText(`${done} of ${total} sections done`)).toBeInTheDocument());
    });
  });

  test("The money table comes from the books (US-6)", ({ given, when, then, and }) => {
    let editor: Editor;
    given("a freshly started draft report", () => {
      editor = openEditor(makeReport());
    });
    when(/^the leader opens the "(.*)" section$/, (title: string) => {
      goToSection(title);
    });
    then(/^the money in row shows "(.*)"$/, (amount: string) => {
      expect(screen.getByTestId("financial-row-money-in")).toHaveTextContent(amount);
    });
    and(/^the balance carried forward shows "(.*)"$/, (amount: string) => {
      expect(screen.getByTestId("financial-row-carried-forward")).toHaveTextContent(amount);
    });
    and("no amount can be edited", () => {
      for (const box of screen.getAllByRole("textbox")) {
        expect(box).not.toHaveValue(expect.stringMatching(/^\d[\d,.]*$/));
      }
      expect(screen.getByText(/From the treasurer's books as of/)).toBeInTheDocument();
    });
    when(/^the leader notes "(.*)" on the money in line "(.*)"$/, (note: string, label: string) => {
      fireEvent.change(screen.getByLabelText(`Note for money in: ${label}`), { target: { value: note } });
    });
    then(/^the note is saved for the money in line "(.*)"$/, (label: string) => {
      const saved = lastSaved(editor, "financial") as { lineNotes: { direction: string; label: string; note: string }[] };
      expect(saved.lineNotes).toContainEqual({ direction: "in", label, note: "Harambee in May" });
    });
  });

  test("Submit lists what is still missing (US-7)", ({ given, when, then, and }) => {
    given("a freshly started draft report", () => {
      openEditor(makeReport());
    });
    when("the leader previews the report", () => {
      fireEvent.click(screen.getByRole("button", { name: "Preview & submit" }));
    });
    then(/^the preview lists the missing sections "(.*)"$/, (titles: string) => {
      const missing = screen.getByTestId("dept-report-missing");
      for (const title of titles.split(",").map((t) => t.trim())) {
        expect(within(missing).getByRole("link", { name: title })).toBeInTheDocument();
      }
    });
    and("Submit report is disabled", () => {
      expect(screen.getByRole("button", { name: "Submit report" })).toBeDisabled();
    });
  });

  test("A complete report is submitted after one confirmation (US-7)", ({ given, when, then }) => {
    let editor: Editor;
    given("a complete draft report", () => {
      editor = openEditor(completeReport());
    });
    when("the leader previews and submits the report", async () => {
      await previewAndSubmit();
    });
    then("the report is submitted", async () => {
      await waitFor(() => expect(editor.onSubmit).toHaveBeenCalledTimes(1));
      expect(editor.draft.flush).toHaveBeenCalled();
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Report submitted. The pastor will review it."));
    });
  });

  test("The leader sees what the reviewer asked for and resubmits (US-10)", ({ given, then, and, when }) => {
    let editor: Editor;
    given(/^a report returned with "(.*)" on "(.*)"$/, (body: string, key: string) => {
      editor = openEditor(completeReport({ status: "returned", comments: [comment(key as SectionKey, body)] }));
    });
    then(/^the comments banner shows "(.*)"$/, (body: string) => {
      expect(screen.getByTestId("dept-report-comments")).toHaveTextContent(body);
    });
    and(/^the comment is pinned on the "(.*)" section$/, (title: string) => {
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
      expect(screen.getByRole("note")).toHaveTextContent("Please add the roof cost");
    });
    when(/^the leader changes achievement 1 to "(.*)"$/, (text: string) => {
      fireEvent.change(screen.getByLabelText("Achievement 1"), { target: { value: text } });
    });
    then(/^the achievements saved are "(.*)"$/, (text: string) => {
      expect(lastSaved(editor, "achievements")).toEqual([{ id: "21", text, fulfilsId: "11" }]);
    });
    when("the leader previews and submits the report", async () => {
      await previewAndSubmit();
    });
    then("the report is submitted", async () => {
      await waitFor(() => expect(editor.onSubmit).toHaveBeenCalledTimes(1));
    });
  });
});
