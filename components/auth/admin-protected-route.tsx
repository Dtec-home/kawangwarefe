/**
 * Admin Protected Route Component
 *
 * Protects admin pages based on user role.
 * Uses useAuth() directly instead of wrapping ProtectedRoute
 * to avoid double loading gates.
 */

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Loader2 } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  /**
   * - `recorder`: staff or holders of the recorder role (the /record workspace).
   * A pure recorder (recorder, not staff) who lacks access to a route is sent
   * to `/record` instead of `/dashboard`.
   * - `department-reports`: staff, department leaders and clerks (R4).
   * - `department-leaders`: staff and department leaders, never a clerk —
   * money pages a leader may use for their own department (fund transfers).
   * - `reports-viewer`: staff or clerks — the department-report tracker and
   * periods (read-only for a clerk; the server enforces it). A pure clerk who
   * lacks access to a route is sent to `/admin/department-reports`.
   */
  requiredAccess?:
    | "staff"
    | "category-admin"
    | "content-admin"
    | "any-admin"
    | "messaging"
    | "recorder"
    | "department-reports"
    | "department-leaders"
    | "reports-viewer";
}

export function AdminProtectedRoute({
  children,
  requiredAccess = "any-admin",
}: AdminProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isStaff, isCategoryAdmin, canAccessContent, canAccessAdmin, canSendBulkMessage, isRecorder, isPureRecorder, isClerk, isPureClerk, ledDepartmentIds, loading: roleLoading, roleInfo } = useUserRole();

  // Treat as loading if: auth is loading, role query is loading, OR
  // role query returned loading:false but hasn't delivered data yet
  // (Apollo cache-first can briefly return {loading:false, data:undefined})
  const isLoading = authLoading || roleLoading || (isAuthenticated && !roleInfo);

  // Compute access once, use everywhere
  const hasAccess = useMemo(() => {
    switch (requiredAccess) {
      case "staff":
        return isStaff;
      case "category-admin":
        return isCategoryAdmin || isStaff;
      case "content-admin":
        return canAccessContent;
      case "messaging":
        return canSendBulkMessage;
      case "any-admin":
        return canAccessAdmin || canAccessContent || canSendBulkMessage;
      case "recorder":
        return isStaff || isRecorder;
      case "department-reports":
        // Staff, the clerk (R4), or anyone who leads a department under
        // either assignment (D1).
        return isStaff || !!isClerk || isCategoryAdmin || (ledDepartmentIds?.length ?? 0) > 0;
      case "department-leaders":
        // Money pages scoped to a leader's own department: no clerk (R4).
        return isStaff || isCategoryAdmin || (ledDepartmentIds?.length ?? 0) > 0;
      case "reports-viewer":
        // The tracker and periods: staff, or the clerk reading (R4).
        return isStaff || !!isClerk;
      default:
        return false;
    }
  }, [requiredAccess, isStaff, isCategoryAdmin, canAccessContent, canAccessAdmin, canSendBulkMessage, isRecorder, isClerk, ledDepartmentIds]);

  // Redirect when not authenticated or not authorized
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (!hasAccess) {
      // Pure recorders are confined to their workspace (RR-4), pure clerks
      // to Department Reports (R4).
      router.push(isPureRecorder ? "/record" : isPureClerk ? "/admin/department-reports" : "/dashboard");
    }
  }, [isAuthenticated, hasAccess, isLoading, isPureRecorder, isPureClerk, router]);

  // Single loading spinner for both auth + role check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
