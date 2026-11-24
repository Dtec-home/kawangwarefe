/**
 * The report page body (DR-7) against a mocked GraphQL layer: header,
 * autosave through the real useReportDraft, submit updating the status,
 * read-only mode, and the not-available state.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor, fireEvent, act } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";

import { ReportPage } from "@/components/department-reports/editor/report-page";
import type { DepartmentReport } from "@/lib/department-reports/types";
import {
  GET_DEPARTMENT_REPORT,
  GET_REPORT_SECTION_SPECS,
  SAVE_REPORT_TEXT,
  SUBMIT_DEPARTMENT_REPORT,
} from "@/lib/graphql/department-reports";

import { completeReport, draftFields, report, specsWithTypename } from "./fixtures";

const actions = vi.fn();
vi.mock("@/components/department-reports/staff/report-actions", () => ({
  ReportActions: (props: { report: DepartmentReport; onChanged?: () => void }) => {
    actions(props);
    return <div data-testid="report-actions-stub" />;
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

afterEach(() => {
  actions.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.useRealTimers();
});

const specsMock: MockedResponse = {
  request: { query: GET_REPORT_SECTION_SPECS },
  result: { data: { reportSectionSpecs: specsWithTypename } },
};

const loadMock = (r: DepartmentReport | null): MockedResponse => ({
  request: { query: GET_DEPARTMENT_REPORT, variables: { id: "5" } },
  result: { data: { departmentReport: r } },
  maxUsageCount: 5,
});


function renderPage(mocks: MockedResponse[]) {
  // MockedProvider renders a single child only.
  return render(
    <MockedProvider mocks={mocks}>
      <ReportPage reportId="5" />
    </MockedProvider>,
  );
}

describe("ReportPage", () => {
  it("shows the department, period, status, progress and the staff actions", async () => {
    renderPage([loadMock(report()), specsMock]);
    expect(await screen.findByRole("heading", { level: 1, name: "Building Fund report" })).toBeInTheDocument();
    expect(screen.getByText(/Period 2026-2027 · Due 31 Jul 2027/)).toBeInTheDocument();
    expect(screen.getByTestId("dept-report-status")).toHaveTextContent("Draft");
    expect(screen.getByText("4 of 8 sections done")).toBeInTheDocument();
    expect(screen.getByTestId("report-actions-stub")).toBeInTheDocument();
    expect(actions).toHaveBeenLastCalledWith(
      expect.objectContaining({ report: expect.objectContaining({ id: "5" }), onChanged: expect.any(Function) }),
    );
    expect(screen.getByTestId("dept-report-stepper")).toBeInTheDocument();
  });

  it("autosaves a section and says Saved", async () => {
    const saved = draftFields(report({ introduction: "We look after the buildings.", missing: report().missing.slice(1), progress: 5 }));
    const save: MockedResponse = {
      request: { query: SAVE_REPORT_TEXT, variables: { id: "5", section: "introduction", text: "We look after the buildings." } },
      result: { data: { saveReportText: saved } },
    };
    renderPage([loadMock(report()), specsMock, save]);
    const box = await screen.findByLabelText("Introduction / Departmental Mission");
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.change(box, { target: { value: "We look after the buildings." } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    vi.useRealTimers();
    await waitFor(() => expect(screen.getByTestId("autosave-status")).toHaveTextContent("Saved"));
    await waitFor(() => expect(screen.getByText("5 of 8 sections done")).toBeInTheDocument());
  });

  it("submits a complete report and shows it read-only as Submitted", async () => {
    const submitted = completeReport({ status: "submitted", canEdit: false, canSubmit: false, financial: { ...completeReport().financial, frozen: true } });
    const submit: MockedResponse = {
      request: { query: SUBMIT_DEPARTMENT_REPORT, variables: { id: "5" } },
      result: { data: { submitDepartmentReport: submitted } },
    };
    renderPage([loadMock(completeReport()), specsMock, submit]);
    fireEvent.click(await screen.findByRole("button", { name: "Preview & submit" }));
    const submitButton = await screen.findByRole("button", { name: "Submit report" });
    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);
    fireEvent.click(within(screen.getByRole("dialog", { name: "Submit report?" })).getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(screen.getByTestId("dept-report-status")).toHaveTextContent("Submitted"));
    expect(toastSuccess).toHaveBeenCalledWith("Report submitted. The pastor will review it.");
    expect(screen.queryByTestId("dept-report-stepper")).not.toBeInTheDocument();
    expect(screen.getByTestId("dept-report-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("autosave-status")).not.toBeInTheDocument();
  });

  it("is read-only when the viewer may not edit (no inputs, preview + actions)", async () => {
    renderPage([loadMock(completeReport({ status: "submitted", canEdit: false, canReview: true })), specsMock]);
    expect(await screen.findByTestId("dept-report-preview")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview & submit" })).not.toBeInTheDocument();
    expect(screen.getByTestId("report-actions-stub")).toBeInTheDocument();
    expect(screen.getAllByTestId("dept-report-status")).toHaveLength(1);
  });

  it("explains when the report is not available", async () => {
    renderPage([loadMock(null), specsMock]);
    expect(await screen.findByText("This report isn't available")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to my reports" })).toHaveAttribute("href", "/admin/department-reports");
  });
});
