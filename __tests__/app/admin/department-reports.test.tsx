/**
 * /admin/department-reports — "My reports" (DR-7): guarded for department
 * leaders and staff, with a PageHeader and the MyReports list.
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
vi.mock("@/components/department-reports/editor/my-reports", () => ({
  MyReports: () => <div data-testid="my-reports" />,
}));

import DepartmentReportsPage from "@/app/(dashboard)/admin/department-reports/page";

describe("Department reports page", () => {
  it("is limited to department leaders and staff", () => {
    render(<DepartmentReportsPage />);
    expect(guard).toHaveBeenCalledWith("department-reports");
  });

  it("shows the page header and the leader's reports", () => {
    render(<DepartmentReportsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Department Reports" })).toBeInTheDocument();
    expect(screen.getByTestId("my-reports")).toBeInTheDocument();
  });
});
