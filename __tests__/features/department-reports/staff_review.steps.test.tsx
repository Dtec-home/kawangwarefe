/**
 * Web binding for `department-reports/staff_review.feature` (DR-8).
 *
 * Renders the real staff screens (periods page, tracker page, ReportActions)
 * against Apollo's MockedProvider with the production documents from
 * lib/graphql/department-reports.ts, so variables must match exactly what the
 * backend receives.
 */

import { defineFeature, loadFeature } from "jest-cucumber";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import { afterEach, expect, vi } from "vitest";
import React, { type ReactNode } from "react";

const { mockDownload, toast } = vi.hoisted(() => ({
  mockDownload: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/download-base64-file", () => ({ downloadBase64File: mockDownload }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/components/auth/admin-protected-route", () => ({
  AdminProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/layouts/admin-layout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => ({ isAdmin: true }) }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/department-reports",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import ReportingPeriodsPage from "@/app/(dashboard)/admin/department-reports/periods/page";
import TrackerPage from "@/app/(dashboard)/admin/department-reports/period/[id]/page";
import { ReportActions } from "@/components/department-reports/staff/report-actions";
import {
  APPROVE_DEPARTMENT_REPORT,
  EXPORT_REPORT_BOOK,
  GET_DEPARTMENT_REPORT_TRACKER,
  GET_REPORTING_PERIODS,
  OPEN_REPORTING_PERIOD,
  REOPEN_DEPARTMENT_REPORT,
  RETURN_DEPARTMENT_REPORT,
} from "@/lib/graphql/department-reports";
import type { DepartmentReport, TrackerRow } from "@/lib/department-reports/types";

import {
  makePeriod,
  makeReport,
  makeRow,
  makeStatement,
  reportResponse,
} from "../../components/department-reports/staff/fixtures";

const feature = loadFeature("./staff_review.feature", { loadRelativePath: true });

type Ctx = { requested: Record<string, unknown> | null; onChanged: ReturnType<typeof vi.fn> };
const newCtx = (): Ctx => ({ requested: null, onChanged: vi.fn() });

afterEach(() => {
  mockDownload.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

// ── Renderers ────────────────────────────────────────────────────────────

const periodsMock = (periods: ReturnType<typeof makePeriod>[], maxUsageCount = 5): MockedResponse => ({
  request: { query: GET_REPORTING_PERIODS },
  result: { data: { reportingPeriods: periods } },
  maxUsageCount,
});

function renderTracker(rows: TrackerRow[], ctx: Ctx) {
  render(
    <MockedProvider
      mocks={[
        periodsMock([makePeriod()]),
        {
          request: { query: GET_DEPARTMENT_REPORT_TRACKER, variables: { periodId: "1" } },
          result: { data: { departmentReportTracker: rows } },
          maxUsageCount: 5,
        },
        {
          request: { query: EXPORT_REPORT_BOOK, variables: { periodId: "1" } },
          result: () => {
            ctx.requested = { periodId: "1" };
            return { data: { exportReportBook: reportResponse("Department-Reports-2025-2026.pdf") } };
          },
        },
      ]}
    >
      <TrackerPage />
    </MockedProvider>,
  );
}

function renderReport(report: DepartmentReport, ctx: Ctx, mocks: MockedResponse[] = []) {
  render(
    <MockedProvider mocks={mocks}>
      <ReportActions report={report} onChanged={ctx.onChanged} />
    </MockedProvider>,
  );
}

const trackerRow = (name: string) =>
  screen.getAllByTestId("dept-report-tracker-row").find((el) => el.textContent?.includes(name))!;

const fillPeriod = (dialog: HTMLElement, label: string, start: string, end: string, due: string) => {
  fireEvent.change(within(dialog).getByLabelText("Label"), { target: { value: label } });
  fireEvent.change(within(dialog).getByLabelText("Start date"), { target: { value: start } });
  fireEvent.change(within(dialog).getByLabelText("End date"), { target: { value: end } });
  fireEvent.change(within(dialog).getByLabelText("Due date"), { target: { value: due } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Open period" }));
};

const TRACKER_ROWS = () => [
  makeRow("Building Fund", "submitted"),
  makeRow("Welfare", "not_started"),
  makeRow("Choir", "draft", { overdue: true }),
];

defineFeature(feature, (test) => {
  test("The admin opens a reporting period (US-1)", ({ given, when, then }) => {
    const ctx = newCtx();
    let created: ReturnType<typeof makePeriod> | null = null;
    given("the admin is on the reporting periods page with no periods", () => {
      const input = { label: "2026-2027", startDate: "2026-07-01", endDate: "2027-06-30", dueDate: "2027-07-31" };
      created = makePeriod({ id: "9", ...input });
      render(
        <MockedProvider
          mocks={[
            periodsMock([], 1),
            {
              request: { query: OPEN_REPORTING_PERIOD, variables: { input } },
              result: () => {
                ctx.requested = input;
                return { data: { openReportingPeriod: created } };
              },
            },
            periodsMock([created]),
          ]}
        >
          <ReportingPeriodsPage />
        </MockedProvider>,
      );
    });
    when(
      /^the admin opens the period "(.+)" from "(.+)" to "(.+)" due "(.+)"$/,
      async (label: string, start: string, end: string, due: string) => {
        fireEvent.click(await screen.findByRole("button", { name: "Open period" }));
        fillPeriod(await screen.findByRole("dialog", { name: "Open reporting period" }), label, start, end, due);
      },
    );
    then(/^the period "(.+)" is listed as "(.+)"$/, async (label: string, status: string) => {
      await waitFor(() => expect(ctx.requested).not.toBeNull());
      const row = await screen.findByTestId("dept-report-period-row");
      expect(row).toHaveTextContent(label);
      expect(row).toHaveTextContent(status);
    });
  });

  test("A due date before the end date is refused before sending (US-1)", ({ given, when, then }) => {
    given("the admin is on the reporting periods page with no periods", () => {
      render(
        <MockedProvider mocks={[periodsMock([])]}>
          <ReportingPeriodsPage />
        </MockedProvider>,
      );
    });
    when(
      /^the admin tries to open the period "(.+)" from "(.+)" to "(.+)" due "(.+)"$/,
      async (label: string, start: string, end: string, due: string) => {
        fireEvent.click(await screen.findByRole("button", { name: "Open period" }));
        fillPeriod(await screen.findByRole("dialog", { name: "Open reporting period" }), label, start, end, due);
      },
    );
    then(/^the form says "(.+)"$/, (message: string) => {
      expect(within(screen.getByRole("dialog")).getByText(message)).toBeInTheDocument();
    });
  });

  test("The pastor follows every department on the tracker (US-8)", ({ given, then, and, when }) => {
    const ctx = newCtx();
    given(/^the pastor opens the tracker for "(.+)"$/, async (label: string) => {
      renderTracker(TRACKER_ROWS(), ctx);
      await screen.findAllByTestId("dept-report-tracker-row");
      await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(label));
    });
    then(/^the tracker shows "(.+)" as "(.+)"$/, (name: string, status: string) => {
      expect(within(trackerRow(name)).getByTestId("dept-report-status")).toHaveTextContent(status);
    });
    and(/^the tracker shows "(.+)" as "(.+)"$/, (name: string, status: string) => {
      expect(within(trackerRow(name)).getByTestId("dept-report-status")).toHaveTextContent(status);
    });
    and(/^"(.+)" is marked overdue$/, (name: string) => {
      expect(within(trackerRow(name)).getByTestId("dept-report-overdue")).toHaveTextContent("Overdue");
    });
    when(/^the pastor filters the tracker by "(.+)"$/, (chip: string) => {
      fireEvent.click(within(screen.getByRole("group", { name: "Filter by status" })).getByRole("button", { name: new RegExp(chip) }));
    });
    then(/^only "(.+)" is listed$/, (name: string) => {
      const rows = screen.getAllByTestId("dept-report-tracker-row");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(name);
    });
  });

  test("The pastor sends a report back with a comment (US-9)", ({ given, when, then }) => {
    const ctx = newCtx();
    given(/^the pastor is reading the submitted "(.+)" report$/, (name: string) => {
      const report = makeReport({ canReview: true, department: { id: "7", name, code: "B" } });
      const comments = [{ sectionKey: "achievements", body: "Please add the roof cost" }];
      renderReport(report, ctx, [
        {
          request: { query: RETURN_DEPARTMENT_REPORT, variables: { id: "5", comments } },
          result: () => {
            ctx.requested = { comments };
            return { data: { returnDepartmentReport: makeReport({ status: "returned" }) } };
          },
        },
      ]);
    });
    when(/^the pastor sends it back with "(.+)" on "(.+)"$/, async (comment: string, section: string) => {
      fireEvent.click(screen.getByRole("button", { name: "Send back" }));
      const dialog = await screen.findByRole("dialog", { name: "Send back to the leader" });
      const select = within(dialog).getByLabelText("Section") as HTMLSelectElement;
      const option = Array.from(select.options).find((o) => o.textContent === section)!;
      fireEvent.change(select, { target: { value: option.value } });
      fireEvent.change(within(dialog).getByLabelText("What needs to change?"), { target: { value: comment } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Send back" }));
    });
    then(/^the report is returned with that comment on "(.+)"$/, async (key: string) => {
      await waitFor(() => expect(ctx.onChanged).toHaveBeenCalled());
      expect(ctx.requested).toEqual({ comments: [{ sectionKey: key, body: "Please add the roof cost" }] });
    });
  });

  test("The pastor approves a submitted report (US-9)", ({ given, when, then }) => {
    const ctx = newCtx();
    given(/^the pastor is reading the submitted "(.+)" report$/, () => {
      renderReport(makeReport({ canReview: true }), ctx, [
        {
          request: { query: APPROVE_DEPARTMENT_REPORT, variables: { id: "5" } },
          result: { data: { approveDepartmentReport: makeReport({ status: "approved" }) } },
        },
      ]);
    });
    when("the pastor approves the report", async () => {
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));
      const dialog = await screen.findByRole("dialog", { name: "Approve report?" });
      fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));
    });
    then("the report is approved", async () => {
      await waitFor(() => expect(ctx.onChanged).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith("Building Fund report approved");
    });
  });

  test("The AGM book waits for an approved report (US-12)", ({ given, then }) => {
    const ctx = newCtx();
    given(/^the pastor opens the tracker for "(.+)" with nothing approved$/, async () => {
      renderTracker(TRACKER_ROWS(), ctx);
      await screen.findAllByTestId("dept-report-tracker-row");
    });
    then("the AGM book cannot be downloaded yet", () => {
      const book = screen.getByRole("button", { name: "Download AGM book" });
      expect(book).toBeDisabled();
      expect(book).toHaveAccessibleDescription(/approved reports only/);
    });
  });

  test("The pastor downloads the AGM book (US-12)", ({ given, when, then }) => {
    const ctx = newCtx();
    given(/^the pastor opens the tracker for "(.+)" with "(.+)" approved$/, async (_label: string, name: string) => {
      renderTracker([...TRACKER_ROWS(), makeRow(name, "approved")], ctx);
      await screen.findAllByTestId("dept-report-tracker-row");
    });
    when("the pastor downloads the AGM book", () => {
      fireEvent.click(screen.getByRole("button", { name: "Download AGM book" }));
    });
    then(/^the file "(.+)" is downloaded$/, async (filename: string) => {
      await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(1));
      expect(mockDownload.mock.calls[0][1]).toBe(filename);
      expect(ctx.requested).toEqual({ periodId: "1" });
    });
  });

  test("The admin reopens an approved report with a reason (US-13)", ({ given, when, then }) => {
    const ctx = newCtx();
    given(/^the admin is reading the approved "(.+)" report$/, () => {
      renderReport(makeReport({ status: "approved", canReopen: true }), ctx, [
        {
          request: { query: REOPEN_DEPARTMENT_REPORT, variables: { id: "5", reason: "The roof invoice was missed" } },
          result: () => {
            ctx.requested = { reason: "The roof invoice was missed" };
            return { data: { reopenDepartmentReport: makeReport({ status: "draft", version: 2 }) } };
          },
        },
      ]);
    });
    when(/^the admin reopens it because "(.+)"$/, async (reason: string) => {
      fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
      const dialog = await screen.findByRole("dialog", { name: "Reopen report?" });
      fireEvent.change(within(dialog).getByLabelText("Reason for reopening"), { target: { value: reason } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Reopen" }));
    });
    then("the report is reopened with that reason", async () => {
      await waitFor(() => expect(ctx.onChanged).toHaveBeenCalled());
      expect(ctx.requested).toEqual({ reason: "The roof invoice was missed" });
    });
  });

  test("The treasurer sees a late entry against the submitted figures (US-15)", ({ given, and, then }) => {
    const ctx = newCtx();
    let moneyIn = "0.00";
    given(/^the treasurer is reading a submitted report whose money in was (.+)$/, (amount: string) => {
      moneyIn = amount;
    });
    and(/^a late gift has since raised money in to (.+)$/, (amount: string) => {
      const submitted = makeStatement({ moneyIn, carriedForward: "4000.00" });
      const live = makeStatement({ moneyIn: amount, carriedForward: "4500.00", frozen: false });
      renderReport(makeReport({ financial: submitted, liveFinancial: live }), ctx);
    });
    then(/^the "Money in" line is highlighted as changed by "(.+)"$/, (difference: string) => {
      const line = screen.getByTestId("live-financial-moneyIn");
      expect(line).toHaveAttribute("data-changed", "true");
      expect(line).toHaveTextContent(difference);
    });
    and(/^the panel says "(.+)"$/, (message: string) => {
      expect(screen.getByTestId("dept-report-live-financial")).toHaveTextContent(message);
    });
  });
});
