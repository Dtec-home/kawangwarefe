/**
 * /admin/department-reports/periods (DR-8, US-1): staff-guarded list; admins
 * open (validated start < end <= due), edit and close periods; ReportError
 * codes shown in plain words; non-admin staff get a read-only list.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import React, { type ReactNode } from "react";

const { guard, role, toast } = vi.hoisted(() => ({
  guard: vi.fn(),
  role: { isAdmin: true },
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
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => role }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    React.createElement("a", { href, ...rest }, children),
}));
vi.mock("sonner", () => ({ toast }));

import ReportingPeriodsPage from "@/app/(dashboard)/admin/department-reports/periods/page";
import {
  CLOSE_REPORTING_PERIOD,
  GET_REPORTING_PERIODS,
  OPEN_REPORTING_PERIOD,
  UPDATE_REPORTING_PERIOD,
} from "@/lib/graphql/department-reports";

import { makePeriod } from "../../components/department-reports/staff/fixtures";

const OLD = makePeriod({ id: "1", label: "2024-2025", startDate: "2024-07-01", endDate: "2025-06-30", dueDate: "2025-07-31", status: "closed" });
const CURRENT = makePeriod({ id: "2", label: "2025-2026" });
const INPUT = { label: "2026-2027", startDate: "2026-07-01", endDate: "2027-06-30", dueDate: "2027-07-31" };

const periodsMock = (periods = [OLD, CURRENT], maxUsageCount = 5): MockedResponse => ({
  request: { query: GET_REPORTING_PERIODS },
  result: { data: { reportingPeriods: periods } },
  maxUsageCount,
});

const reportError = (code: string, message = "") => ({ __typename: "ReportError", code, message, missing: [] });

function setup(mocks: MockedResponse[] = [periodsMock()]) {
  render(
    <MockedProvider mocks={mocks}>
      <ReportingPeriodsPage />
    </MockedProvider>,
  );
}

function fillForm(dialog: HTMLElement, values: Partial<typeof INPUT>) {
  const labels: Record<keyof typeof INPUT, string> = {
    label: "Label",
    startDate: "Start date",
    endDate: "End date",
    dueDate: "Due date",
  };
  for (const [key, value] of Object.entries(values)) {
    fireEvent.change(within(dialog).getByLabelText(labels[key as keyof typeof INPUT]), { target: { value } });
  }
}

beforeEach(() => {
  role.isAdmin = true;
});
afterEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  guard.mockReset();
});

describe("Reporting periods page", () => {
  it("is limited to staff", () => {
    setup();
    expect(guard).toHaveBeenCalledWith("staff");
  });

  it("lists periods (open first) with dates, due date, status and a tracker link", async () => {
    setup();
    const rows = await screen.findAllByTestId("dept-report-period-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("2025-2026");
    expect(rows[0]).toHaveTextContent("Open");
    expect(rows[0]).toHaveTextContent("1 Jul 2025 – 30 Jun 2026");
    expect(rows[0]).toHaveTextContent("Due 31 Jul 2026");
    expect(rows[1]).toHaveTextContent("Closed");
    expect(within(rows[0]).getByRole("link", { name: "2025-2026" })).toHaveAttribute(
      "href",
      "/admin/department-reports/period/2",
    );
    // Only the open period can be closed.
    expect(within(rows[0]).getByRole("button", { name: "Close period 2025-2026" })).toBeInTheDocument();
    expect(within(rows[1]).queryByRole("button", { name: /Close period/ })).not.toBeInTheDocument();
  });

  it("shows an empty state that invites the admin to open the first period", async () => {
    setup([periodsMock([])]);
    expect(await screen.findByText("No reporting periods yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open the first period" })).toBeInTheDocument();
  });

  it("is read-only for staff who are not admins", async () => {
    role.isAdmin = false;
    setup();
    await screen.findAllByTestId("dept-report-period-row");
    expect(screen.queryByRole("button", { name: "Open period" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Close period/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Only an admin can open, edit or close/)).toBeInTheDocument();
  });

  it("validates the dates before sending", async () => {
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Open period" }));
    const dialog = await screen.findByRole("dialog", { name: "Open reporting period" });
    expect(within(dialog).getByLabelText("Label")).toHaveAttribute("placeholder", "2025-2026");
    expect(within(dialog).getByLabelText("Start date")).toHaveAttribute("type", "date");

    fireEvent.click(within(dialog).getByRole("button", { name: "Open period" }));
    expect(within(dialog).getByText("Choose the start date")).toBeInTheDocument();

    fillForm(dialog, { ...INPUT, endDate: "2026-06-01", dueDate: "2026-05-01" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Open period" }));
    expect(within(dialog).getByText("The end date must be after the start date")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("End date")).toHaveAttribute("aria-invalid", "true");
  });

  it("opens a period and refreshes the list", async () => {
    let opened = false;
    setup([
      periodsMock([OLD], 1),
      {
        request: { query: OPEN_REPORTING_PERIOD, variables: { input: INPUT } },
        result: () => {
          opened = true;
          return { data: { openReportingPeriod: makePeriod({ id: "3", ...INPUT }) } };
        },
      },
      periodsMock([OLD, makePeriod({ id: "3", ...INPUT })]),
    ]);
    fireEvent.click(await screen.findByRole("button", { name: "Open period" }));
    const dialog = await screen.findByRole("dialog", { name: "Open reporting period" });
    fillForm(dialog, { ...INPUT, label: " 2026-2027 " });
    fireEvent.click(within(dialog).getByRole("button", { name: "Open period" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Period 2026-2027 opened"));
    expect(opened).toBe(true);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByTestId("dept-report-period-row")).toHaveLength(2));
  });

  it.each([
    ["period_already_open", "Another reporting period is still open. Close it before opening a new one."],
    ["forbidden", "You don't have permission to do that."],
    ["invalid_dates", "Check the dates: the period must start before it ends, and be due on or after its end."],
  ])("explains %s inside the dialog", async (code, message) => {
    setup([
      periodsMock(),
      {
        request: { query: OPEN_REPORTING_PERIOD, variables: { input: INPUT } },
        result: { data: { openReportingPeriod: reportError(code) } },
      },
    ]);
    fireEvent.click(await screen.findByRole("button", { name: "Open period" }));
    const dialog = await screen.findByRole("dialog", { name: "Open reporting period" });
    fillForm(dialog, INPUT);
    fireEvent.click(within(dialog).getByRole("button", { name: "Open period" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(message);
  });

  it("edits a period, prefilled", async () => {
    let saved: unknown = null;
    setup([
      periodsMock(),
      {
        request: {
          query: UPDATE_REPORTING_PERIOD,
          variables: {
            id: "2",
            input: { label: "2025-2026", startDate: "2025-07-01", endDate: "2026-06-30", dueDate: "2026-08-15" },
          },
        },
        result: (v: unknown) => {
          saved = v;
          return { data: { updateReportingPeriod: makePeriod({ id: "2", dueDate: "2026-08-15" }) } };
        },
      },
    ]);
    fireEvent.click(await screen.findByRole("button", { name: "Edit 2025-2026" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit reporting period" });
    expect(within(dialog).getByLabelText("Label")).toHaveValue("2025-2026");
    fillForm(dialog, { dueDate: "2026-08-15" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Period 2025-2026 updated"));
    expect(saved).toBeTruthy();
  });

  it("closes a period after confirming", async () => {
    setup([
      periodsMock(),
      {
        request: { query: CLOSE_REPORTING_PERIOD, variables: { id: "2" } },
        result: { data: { closeReportingPeriod: makePeriod({ id: "2", status: "closed" }) } },
      },
    ]);
    fireEvent.click(await screen.findByRole("button", { name: "Close period 2025-2026" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Close period 2025-2026?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close period" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Period 2025-2026 closed"));
  });

  it("toasts a close refusal in plain words", async () => {
    setup([
      periodsMock(),
      {
        request: { query: CLOSE_REPORTING_PERIOD, variables: { id: "2" } },
        result: { data: { closeReportingPeriod: reportError("forbidden", "not allowed") } },
      },
    ]);
    fireEvent.click(await screen.findByRole("button", { name: "Close period 2025-2026" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close period" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("You don't have permission to do that."));
  });
});
