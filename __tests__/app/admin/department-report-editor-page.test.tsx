/**
 * /admin/department-reports/[id] (DR-7): guarded for department leaders and
 * staff; renders the report page for the id in the URL.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const guard = vi.fn();
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
  useParams: () => ({ id: "42" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/department-reports/42",
}));
vi.mock("@/components/department-reports/editor/report-page", () => ({
  ReportPage: ({ reportId }: { reportId: string }) => <div data-testid="report-page">{reportId}</div>,
}));

import DepartmentReportPage from "@/app/(dashboard)/admin/department-reports/[id]/page";

describe("Department report page", () => {
  it("is limited to department leaders and staff", () => {
    render(<DepartmentReportPage />);
    expect(guard).toHaveBeenCalledWith("department-reports");
  });

  it("opens the report named in the URL", () => {
    render(<DepartmentReportPage />);
    expect(screen.getByTestId("report-page")).toHaveTextContent("42");
  });
});
