/**
 * /admin/department-reports/period/[id] (DR-8, US-8/US-12): staff-guarded
 * tracker — one row per department with status, overdue chip, progress and
 * "Open"; count chips that filter; a no-leader warning; empty states; and
 * the AGM book button (disabled until a report is approved).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import React, { type ReactNode } from "react";

const { guard, mockDownload, toast } = vi.hoisted(() => ({
  guard: vi.fn(),
  mockDownload: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/components/auth/admin-protected-route", () => ({
  AdminProtectedRoute: ({ children, requiredAccess }: { children: ReactNode; requiredAccess: string }) => {
    guard(requiredAccess);
    return <>{children}</>;
  },
}));
vi.mock("@/components/layouts/admin-layout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/department-reports/period/1",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    React.createElement("a", { href, ...rest }, children),
}));
vi.mock("@/lib/download-base64-file", () => ({ downloadBase64File: mockDownload }));
vi.mock("sonner", () => ({ toast }));

import TrackerPage from "@/app/(dashboard)/admin/department-reports/period/[id]/page";
import {
  EXPORT_REPORT_BOOK,
  GET_DEPARTMENT_REPORT_TRACKER,
  GET_REPORTING_PERIODS,
} from "@/lib/graphql/department-reports";
import type { TrackerRow } from "@/lib/department-reports/types";

import { makePeriod, makeRow, reportResponse } from "../../components/department-reports/staff/fixtures";

const periodsMock: MockedResponse = {
  request: { query: GET_REPORTING_PERIODS },
  result: { data: { reportingPeriods: [makePeriod()] } },
  maxUsageCount: 5,
};

const trackerMock = (rows: TrackerRow[]): MockedResponse => ({
  request: { query: GET_DEPARTMENT_REPORT_TRACKER, variables: { periodId: "1" } },
  result: { data: { departmentReportTracker: rows } },
  maxUsageCount: 5,
});

const ROWS = [
  makeRow("Youth", "not_started", { overdue: true, leaderNames: [] }),
  makeRow("Choir", "draft", { overdue: true }),
  makeRow("Building Fund", "submitted", { leaderNames: ["Jane Wanjiru", "Peter Otieno"] }),
  makeRow("Welfare", "returned"),
  makeRow("Ushers", "approved"),
];

function setup(rows: TrackerRow[] = ROWS, extra: MockedResponse[] = []) {
  render(
    <MockedProvider mocks={[periodsMock, trackerMock(rows), ...extra]}>
      <TrackerPage />
    </MockedProvider>,
  );
}

const row = (name: string) =>
  screen.getAllByTestId("dept-report-tracker-row").find((el) => el.textContent?.includes(name))!;

afterEach(() => {
  mockDownload.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("Department report tracker", () => {
  it("is limited to staff and the clerk (R4) and titled by the period", async () => {
    setup();
    expect(guard).toHaveBeenCalledWith("reports-viewer");
    expect(await screen.findByRole("heading", { level: 1, name: "Department reports 2025-2026" })).toBeInTheDocument();
    expect(screen.getByText(/due 31 Jul 2026/)).toBeInTheDocument();
  });

  it("shows a row per department with status, leaders, overdue chip and progress", async () => {
    setup();
    expect(await screen.findAllByTestId("dept-report-tracker-row")).toHaveLength(5);
    expect(within(row("Building Fund")).getByTestId("dept-report-status")).toHaveTextContent("Submitted");
    expect(row("Building Fund")).toHaveTextContent("Jane Wanjiru, Peter Otieno");
    expect(within(row("Youth")).getByTestId("dept-report-status")).toHaveTextContent("Not started");
    expect(within(row("Choir")).getByTestId("dept-report-overdue")).toBeInTheDocument();
    expect(within(row("Building Fund")).queryByTestId("dept-report-overdue")).not.toBeInTheDocument();
    expect(within(row("Choir")).getByRole("img", { name: "4 of 6 sections done" })).toBeInTheDocument();
  });

  it("links to the report when one exists", async () => {
    setup();
    await screen.findAllByTestId("dept-report-tracker-row");
    const open = within(row("Building Fund")).getByRole("link", { name: /Open/ });
    expect(open).toHaveAttribute("href", `/admin/department-reports/${ROWS[2].report!.id}`);
    expect(within(row("Youth")).queryByRole("link", { name: /Open/ })).not.toBeInTheDocument();
    expect(row("Youth")).toHaveTextContent("No report yet");
  });

  it("lists departments with no leader and no report apart, collapsed", async () => {
    setup();
    await screen.findAllByTestId("dept-report-tracker-row");
    const unassigned = screen.getByTestId("dept-report-unassigned");
    expect(unassigned).not.toHaveAttribute("open");
    expect(unassigned).toHaveTextContent("1 department has no leader");
    expect(within(unassigned).getByText("Youth")).toBeInTheDocument();
    expect(within(unassigned).getByText("No leader assigned")).toBeInTheDocument();
    const main = screen.getByRole("list", { name: "Departments" });
    expect(within(main).queryByText("Youth")).not.toBeInTheDocument();
  });

  it("counts chips and filters the list", async () => {
    setup();
    await screen.findAllByTestId("dept-report-tracker-row");
    const chips = screen.getByRole("group", { name: "Filter by status" });
    // Youth has no leader and no report, so it is counted apart (collapsed group).
    expect(within(chips).getByRole("button", { name: /All\s*4/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(chips).getByRole("button", { name: /Overdue\s*1/ })).toBeInTheDocument();
    expect(within(chips).getByRole("button", { name: /Approved\s*1/ })).toBeInTheDocument();
    expect(screen.getByTestId("dept-report-tracker-summary")).toHaveTextContent(
      "2 of 4 departments have handed in their report · 1 approved · 1 overdue",
    );

    const main = () => screen.getByRole("list", { name: "Departments" });
    fireEvent.click(within(chips).getByRole("button", { name: /Overdue/ }));
    expect(
      within(main()).getAllByTestId("dept-report-tracker-row").map((r) => r.querySelector("p")?.textContent),
    ).toEqual(["Choir"]);
    fireEvent.click(within(chips).getByRole("button", { name: /Submitted/ }));
    expect(within(main()).getAllByTestId("dept-report-tracker-row")).toHaveLength(1);
  });

  it("offers 'Show all' when a filter matches nothing", async () => {
    setup(ROWS.slice(0, 2));
    await screen.findAllByTestId("dept-report-tracker-row");
    fireEvent.click(screen.getByRole("button", { name: /Approved/ }));
    expect(screen.getByText("No departments match this filter")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getAllByTestId("dept-report-tracker-row")).toHaveLength(2);
  });

  it("shows an empty state when there are no departments", async () => {
    setup([]);
    expect(await screen.findByText("No departments to report on")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download AGM book" })).toBeDisabled();
  });

  it("disables the AGM book, with a reason, until a report is approved", async () => {
    setup(ROWS.slice(0, 4));
    await screen.findAllByTestId("dept-report-tracker-row");
    const book = screen.getByRole("button", { name: "Download AGM book" });
    expect(book).toBeDisabled();
    expect(book).toHaveAccessibleDescription(/approved reports only/);
  });

  it("downloads the AGM book with the server's filename", async () => {
    setup(ROWS, [
      {
        request: { query: EXPORT_REPORT_BOOK, variables: { periodId: "1" } },
        result: { data: { exportReportBook: reportResponse("Department-Reports-2025-2026.pdf") } },
      },
    ]);
    await screen.findAllByTestId("dept-report-tracker-row");
    const book = screen.getByRole("button", { name: "Download AGM book" });
    expect(book).toBeEnabled();
    fireEvent.click(book);
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith("QUJD", "Department-Reports-2025-2026.pdf", "application/pdf"),
    );
  });

  it("explains a tracker the viewer may not see", async () => {
    render(
      <MockedProvider
        mocks={[
          periodsMock,
          {
            request: { query: GET_DEPARTMENT_REPORT_TRACKER, variables: { periodId: "1" } },
            result: { errors: [{ message: "You are not allowed to see department reports." }] } as never,
          },
        ]}
      >
        <TrackerPage />
      </MockedProvider>,
    );
    expect(await screen.findByText("The tracker could not be loaded")).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to do that.")).toBeInTheDocument();
  });
});
