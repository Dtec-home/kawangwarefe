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
   */
  requiredAccess?: "staff" | "category-admin" | "content-admin" | "any-admin" | "messaging" | "recorder";
}

export function AdminProtectedRoute({
  children,
  requiredAccess = "any-admin",
}: AdminProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isStaff, isCategoryAdmin, canAccessContent, canAccessAdmin, canSendBulkMessage, isRecorder, isPureRecorder, loading: roleLoading, roleInfo } = useUserRole();

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
      default:
        return false;
    }
  }, [requiredAccess, isStaff, isCategoryAdmin, canAccessContent, canAccessAdmin, canSendBulkMessage, isRecorder]);

  // Redirect when not authenticated or not authorized
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (!hasAccess) {
      // Pure recorders are confined to their workspace (RR-4)
      router.push(isPureRecorder ? "/record" : "/dashboard");
    }
  }, [isAuthenticated, hasAccess, isLoading, isPureRecorder, router]);

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
