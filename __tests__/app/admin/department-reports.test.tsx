/**
 * /admin/department-reports placeholder (DR-6; DR-7 replaces it): guarded like
 * the other category-admin pages, with a PageHeader and an Empty state.
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

import DepartmentReportsPage from "@/app/(dashboard)/admin/department-reports/page";

describe("Department reports page (placeholder)", () => {
  it("is limited to department leaders and staff", () => {
    render(<DepartmentReportsPage />);
    expect(guard).toHaveBeenCalledWith("department-reports");
  });

  it("shows the page header and a coming-soon empty state", () => {
    render(<DepartmentReportsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Department Reports" })).toBeInTheDocument();
    expect(screen.getByText("Department reports are coming soon")).toBeInTheDocument();
  });
});
