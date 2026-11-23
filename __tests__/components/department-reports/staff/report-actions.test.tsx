/**
 * ReportActions (DR-8, US-9/US-11/US-13/US-15): downloads for every reader,
 * review buttons only with canReview, Reopen only with canReopen, the
 * multi-comment send-back flow, approve/reopen dialogs, ReportError → toast,
 * onChanged after success, and the live-vs-frozen money panel.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";

const { mockDownload, toast } = vi.hoisted(() => ({
  mockDownload: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/download-base64-file", () => ({ downloadBase64File: mockDownload }));
vi.mock("sonner", () => ({ toast }));

import { ReportActions } from "@/components/department-reports/staff/report-actions";
import { commentsToSend } from "@/components/department-reports/staff/send-back-dialog";
import {
  APPROVE_DEPARTMENT_REPORT,
  EXPORT_DEPARTMENT_REPORT,
  GET_REPORT_SECTION_SPECS,
  REOPEN_DEPARTMENT_REPORT,
  RETURN_DEPARTMENT_REPORT,
} from "@/lib/graphql/department-reports";
import { DEFAULT_SECTION_SPECS } from "@/lib/department-reports/sections";
import type { DepartmentReport } from "@/lib/department-reports/types";

import { makeReport, makeStatement, reportResponse } from "./fixtures";

const specsMock: MockedResponse = {
  request: { query: GET_REPORT_SECTION_SPECS },
  result: {
    data: { reportSectionSpecs: DEFAULT_SECTION_SPECS.map((s) => ({ __typename: "ReportSectionSpec", ...s })) },
  },
  maxUsageCount: 10,
};

const reportError = (code: string, message = "server message") => ({
  __typename: "ReportError",
  code,
  message,
  missing: [],
});

function setup(report: DepartmentReport, mocks: MockedResponse[] = [], onChanged = vi.fn()) {
  render(
    <MockedProvider mocks={[specsMock, ...mocks]}>
      <ReportActions report={report} onChanged={onChanged} />
    </MockedProvider>,
  );
  return { onChanged };
}

afterEach(() => {
  mockDownload.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("ReportActions — visibility by can* flags", () => {
  it("a reader without review rights only sees the downloads", () => {
    setup(makeReport());
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Word" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send back" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("dept-report-live-financial")).not.toBeInTheDocument();
  });

  it("a reviewer sees Send back and Approve", () => {
    setup(makeReport({ canReview: true }));
    expect(screen.getByRole("button", { name: "Send back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen" })).not.toBeInTheDocument();
  });

  it("an admin on an approved report sees Reopen only", () => {
    setup(makeReport({ status: "approved", canReopen: true }));
    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});

describe("ReportActions — downloads", () => {
  it.each([
    ["Download PDF", "pdf", "Building-Fund-Department-Report-2025-2026.pdf", "application/pdf"],
    [
      "Download Word",
      "docx",
      "Building-Fund-Department-Report-2025-2026.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ])("%s saves the server's file", async (label, format, filename, contentType) => {
    setup(makeReport(), [
      {
        request: { query: EXPORT_DEPARTMENT_REPORT, variables: { id: "5", format } },
        result: { data: { exportDepartmentReport: reportResponse(filename, contentType) } },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(mockDownload).toHaveBeenCalledWith("QUJD", filename, contentType));
  });

  it("shows the server's refusal instead of downloading", async () => {
    setup(makeReport(), [
      {
        request: { query: EXPORT_DEPARTMENT_REPORT, variables: { id: "5", format: "pdf" } },
        result: {
          data: {
            exportDepartmentReport: {
              __typename: "ReportResponse",
              success: false,
              message: "You are not allowed to see department reports.",
              fileData: null,
              filename: null,
              contentType: null,
            },
          },
        },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("You are not allowed to see department reports."));
    expect(mockDownload).not.toHaveBeenCalled();
  });
});

describe("ReportActions — send back", () => {
  it("keeps only non-empty comments, trimmed", () => {
    expect(
      commentsToSend([
        { sectionKey: "achievements", body: "  Add the roof cost " },
        { sectionKey: "conclusion", body: "   " },
      ]),
    ).toEqual([{ sectionKey: "achievements", body: "Add the roof cost" }]);
  });

  it("queues several comments and returns the report", async () => {
    let sent: unknown = null;
    const { onChanged } = setup(makeReport({ canReview: true }), [
      {
        request: {
          query: RETURN_DEPARTMENT_REPORT,
          variables: {
            id: "5",
            comments: [
              { sectionKey: "achievements", body: "Please add the roof cost" },
              { sectionKey: "financial", body: "Explain the March expense" },
            ],
          },
        },
        result: (vars: unknown) => {
          sent = vars;
          return { data: { returnDepartmentReport: makeReport({ status: "returned" }) } };
        },
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Send back" }));
    const dialog = await screen.findByRole("dialog", { name: "Send back to the leader" });
    const submit = within(dialog).getByRole("button", { name: "Send back" });
    expect(submit).toBeDisabled();

    // Options are the 8 section titles, keyed by section.
    const select = within(dialog).getByLabelText("Section") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(DEFAULT_SECTION_SPECS.map((s) => s.title));
    fireEvent.change(select, { target: { value: "achievements" } });
    fireEvent.change(within(dialog).getByLabelText("What needs to change?"), {
      target: { value: "Please add the roof cost" },
    });
    expect(submit).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Add another comment" }));
    const second = within(dialog).getByRole("group", { name: "Comment 2" });
    fireEvent.change(within(second).getByLabelText("Section"), { target: { value: "financial" } });
    fireEvent.change(within(second).getByLabelText("What needs to change?"), {
      target: { value: "Explain the March expense" },
    });
    // A third, empty comment is dropped, and can be removed.
    fireEvent.click(within(dialog).getByRole("button", { name: "Add another comment" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove comment 3" }));

    fireEvent.click(submit);
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(sent).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith("Sent back to the Building Fund leaders");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("maps a ReportError to a friendly toast and keeps the dialog open", async () => {
    const { onChanged } = setup(makeReport({ canReview: true }), [
      {
        request: {
          query: RETURN_DEPARTMENT_REPORT,
          variables: { id: "5", comments: [{ sectionKey: "introduction", body: "Too short" }] },
        },
        result: { data: { returnDepartmentReport: reportError("invalid_transition") } },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Send back" }));
    const dialog = await screen.findByRole("dialog", { name: "Send back to the leader" });
    fireEvent.change(within(dialog).getByLabelText("What needs to change?"), { target: { value: "Too short" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send back" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Refresh the page/)));
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Send back to the leader" })).toBeInTheDocument();
  });
});

describe("ReportActions — approve", () => {
  it("confirms, approves and tells the page", async () => {
    const { onChanged } = setup(makeReport({ canReview: true }), [
      {
        request: { query: APPROVE_DEPARTMENT_REPORT, variables: { id: "5" } },
        result: { data: { approveDepartmentReport: makeReport({ status: "approved" }) } },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog", { name: "Approve report?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("Building Fund report approved");
  });

  it("explains a four-eyes refusal", async () => {
    setup(makeReport({ canReview: true }), [
      {
        request: { query: APPROVE_DEPARTMENT_REPORT, variables: { id: "5" } },
        result: { data: { approveDepartmentReport: reportError("forbidden") } },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog", { name: "Approve report?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("You don't have permission to do that."));
  });
});

describe("ReportActions — reopen", () => {
  it("requires a reason, then reopens", async () => {
    const { onChanged } = setup(makeReport({ status: "approved", canReopen: true }), [
      {
        request: { query: REOPEN_DEPARTMENT_REPORT, variables: { id: "5", reason: "Missed the roof invoice" } },
        result: { data: { reopenDepartmentReport: makeReport({ status: "draft", version: 2 }) } },
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    const dialog = await screen.findByRole("dialog", { name: "Reopen report?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reopen" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Give a reason for reopening the report.");
    expect(onChanged).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText("Reason for reopening"), {
      target: { value: "  Missed the roof invoice " },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("Building Fund report reopened");
  });

  it("toasts a thrown network error", async () => {
    setup(makeReport({ status: "approved", canReopen: true }), [
      {
        request: { query: REOPEN_DEPARTMENT_REPORT, variables: { id: "5", reason: "Typo" } },
        error: new Error("Network down"),
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    const dialog = await screen.findByRole("dialog", { name: "Reopen report?" });
    fireEvent.change(within(dialog).getByLabelText("Reason for reopening"), { target: { value: "Typo" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Network down")));
  });
});

describe("ReportActions — books today vs submitted (US-15)", () => {
  it("highlights lines a late entry changed and opens by itself", () => {
    setup(
      makeReport({
        financial: makeStatement(),
        liveFinancial: makeStatement({ moneyIn: "5500.00", carriedForward: "4500.00", frozen: false }),
      }),
    );
    const panel = screen.getByTestId("dept-report-live-financial");
    expect(within(panel).getByRole("button", { name: /Books today vs submitted/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(panel).toHaveTextContent("A late entry changed the figures after submission");
    expect(within(panel).getByTestId("live-financial-moneyIn")).toHaveAttribute("data-changed", "true");
    expect(within(panel).getByTestId("live-financial-moneyOut")).toHaveAttribute("data-changed", "false");
    expect(within(panel).getByTestId("live-financial-moneyIn")).toHaveTextContent("+KES 500.00");
  });

  it("stays collapsed when the books still match, and toggles", () => {
    setup(makeReport({ liveFinancial: makeStatement({ frozen: false }) }));
    const toggle = screen.getByRole("button", { name: /Books today vs submitted/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByText("The books still match the submitted figures.")).toBeInTheDocument();
  });
});
