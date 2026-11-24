/**
 * useReportPermissions (DR-6): reads the report's can* fields only — never the
 * viewer's roles (02_CONTRACTS.md § Frontend).
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const roleSpy = vi.fn();
vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: () => {
    roleSpy();
    return { isStaff: true, isAdmin: true };
  },
}));

import { reportPermissions, useReportPermissions } from "@/lib/department-reports/use-report-permissions";

const flags = { canEdit: true, canSubmit: false, canReview: true, canReopen: false };

describe("useReportPermissions", () => {
  it("passes the server's flags through", () => {
    const { result } = renderHook(() => useReportPermissions(flags));
    expect(result.current).toEqual({ canEdit: true, canSubmit: false, canReview: true, canReopen: false });
  });

  it("denies everything while the report is loading or missing", () => {
    expect(reportPermissions(null)).toEqual({ canEdit: false, canSubmit: false, canReview: false, canReopen: false });
    expect(reportPermissions(undefined)).toEqual({ canEdit: false, canSubmit: false, canReview: false, canReopen: false });
  });

  it("never derives permissions from roles", () => {
    renderHook(() => useReportPermissions({ canEdit: false, canSubmit: false, canReview: false, canReopen: false }));
    expect(roleSpy).not.toHaveBeenCalled();
  });
});
