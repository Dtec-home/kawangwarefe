/**
 * "My reports" (US-2, DR-7): a card per led department with status, due-date
 * countdown and progress; Start report / Continue; empty states; staff links.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";

import { MyReports } from "@/components/department-reports/editor/my-reports";
import {
  GET_MY_DEPARTMENT_REPORTS,
  GET_REPORTING_PERIODS,
  START_DEPARTMENT_REPORT,
} from "@/lib/graphql/department-reports";

import { LAST_PERIOD, OPEN_PERIOD, report, trackerRow } from "./fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/department-reports",
  useSearchParams: () => new URLSearchParams(),
}));

const role = { isStaff: false, isAdmin: false, isClerk: false };
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => role }));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

const periodsMock = (periods = [LAST_PERIOD, OPEN_PERIOD]): MockedResponse => ({
  request: { query: GET_REPORTING_PERIODS },
  result: { data: { reportingPeriods: periods } },
});

const rowsMock = (rows: unknown[]): MockedResponse => ({
  request: { query: GET_MY_DEPARTMENT_REPORTS, variables: { periodId: null } },
  result: { data: { myDepartmentReports: rows } },
});

const trackerReport = (overrides: Record<string, unknown> = {}) => ({
  __typename: "DepartmentReport",
  id: "5",
  status: "draft",
  overdue: false,
  progress: 5,
  version: 1,
  canEdit: true,
  canReview: false,
  ...overrides,
});

function renderPage(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <MyReports />
    </MockedProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-07-19T09:00:00+03:00"));
});
afterEach(() => {
  vi.useRealTimers();
  push.mockReset();
  toastError.mockReset();
  role.isStaff = false;
  role.isAdmin = false;
  role.isClerk = false;
});

describe("MyReports", () => {
  it("shows a card per department with period, status, countdown and Start report", async () => {
    renderPage([periodsMock(), rowsMock([trackerRow()])]);
    const card = await screen.findByTestId("dept-report-card");
    expect(within(card).getByRole("heading", { name: "Building Fund" })).toBeInTheDocument();
    expect(card).toHaveTextContent("Period 2026-2027");
    expect(within(card).getByTestId("dept-report-status")).toHaveTextContent("Not started");
    expect(card).toHaveTextContent("Due 31 Jul 2027");
    expect(card).toHaveTextContent("Due in 12 days");
    expect(within(card).getByRole("img", { name: "0 of 6 sections done" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Start report" })).toBeEnabled();
  });

  it("starts the report and opens the editor", async () => {
    const start: MockedResponse = {
      request: { query: START_DEPARTMENT_REPORT, variables: { periodId: "3", departmentId: "7" } },
      result: { data: { startDepartmentReport: report() } },
    };
    renderPage([periodsMock(), rowsMock([trackerRow()]), start]);
    vi.useRealTimers();
    await userEvent.click(await screen.findByRole("button", { name: "Start report" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/department-reports/5"));
  });

  it("says why a report could not be started", async () => {
    const start: MockedResponse = {
      request: { query: START_DEPARTMENT_REPORT, variables: { periodId: "3", departmentId: "7" } },
      result: {
        data: { startDepartmentReport: { __typename: "ReportError", code: "period_closed", message: "x", missing: [] } },
      },
    };
    renderPage([periodsMock(), rowsMock([trackerRow()]), start]);
    vi.useRealTimers();
    await userEvent.click(await screen.findByRole("button", { name: "Start report" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("This reporting period is closed."));
    expect(push).not.toHaveBeenCalled();
  });

  it("continues a draft, with its progress", async () => {
    const row = trackerRow({ status: "draft", progress: 5, report: trackerReport() as never });
    renderPage([periodsMock(), rowsMock([row])]);
    const card = await screen.findByTestId("dept-report-card");
    expect(within(card).getByTestId("dept-report-status")).toHaveTextContent("Draft");
    expect(card).toHaveTextContent("5 of 6 required sections done");
    vi.useRealTimers();
    await userEvent.click(within(card).getByRole("button", { name: "Continue" }));
    expect(push).toHaveBeenCalledWith("/admin/department-reports/5");
  });

  it("shows overdue reports with a chip and the days late", async () => {
    vi.setSystemTime(new Date("2027-08-03T09:00:00+03:00"));
    const row = trackerRow({ status: "returned", overdue: true, report: trackerReport({ status: "returned", overdue: true }) as never });
    renderPage([periodsMock(), rowsMock([row])]);
    const card = await screen.findByTestId("dept-report-card");
    expect(within(card).getByTestId("dept-report-overdue")).toHaveTextContent("Overdue");
    expect(card).toHaveTextContent("3 days overdue");
  });

  it("offers View report once the report is handed in, without a countdown", async () => {
    const row = trackerRow({ status: "submitted", progress: 8, report: trackerReport({ status: "submitted", canEdit: false }) as never });
    renderPage([periodsMock(), rowsMock([row])]);
    const card = await screen.findByTestId("dept-report-card");
    expect(within(card).getByRole("button", { name: "View report" })).toBeInTheDocument();
    expect(card).not.toHaveTextContent("Due in");
  });

  it("says when no period is open", async () => {
    renderPage([periodsMock([LAST_PERIOD]), rowsMock([])]);
    expect(await screen.findByText("No reporting period is open")).toBeInTheDocument();
  });

  it("says when the user leads no department", async () => {
    renderPage([periodsMock(), rowsMock([])]);
    expect(await screen.findByText("You don't lead a department")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /tracker/ })).not.toBeInTheDocument();
  });

  it("links staff to the tracker, and admins to the reporting periods", async () => {
    role.isStaff = true;
    role.isAdmin = true;
    renderPage([periodsMock(), rowsMock([])]);
    expect(await screen.findByRole("link", { name: "Open the tracker" })).toHaveAttribute(
      "href",
      "/admin/department-reports/period/3",
    );
    expect(screen.getByRole("link", { name: "Reporting periods" })).toHaveAttribute("href", "/admin/department-reports/periods");
  });

  it("does not show admins-only links to a pastor", async () => {
    role.isStaff = true;
    renderPage([periodsMock(), rowsMock([])]);
    expect(await screen.findByRole("link", { name: "Open the tracker" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reporting periods" })).not.toBeInTheDocument();
  });

  it("links the clerk to the tracker but not to the reporting-period settings (R4)", async () => {
    role.isClerk = true;
    renderPage([periodsMock(), rowsMock([])]);
    expect(await screen.findByRole("link", { name: "Open the tracker" })).toHaveAttribute(
      "href",
      "/admin/department-reports/period/3",
    );
    expect(screen.queryByRole("link", { name: "Reporting periods" })).not.toBeInTheDocument();
    expect(screen.getByText(/Use the tracker to read every department's report/)).toBeInTheDocument();
  });
});
