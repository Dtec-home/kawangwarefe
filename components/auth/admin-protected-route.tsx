/**
 * Admin Protected Route Component
 *
 * Protects admin pages based on user role.
 * - Staff-only pages: Members, Reports, Category Admins management
 * - Category admin pages: Overview, Contributions (filtered)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { ProtectedRoute } from "./protected-route";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredAccess?: "staff" | "category-admin" | "any-admin";
}

export function AdminProtectedRoute({
  children,
  requiredAccess = "any-admin",
}: AdminProtectedRouteProps) {
  const router = useRouter();
  const { isStaff, isCategoryAdmin, canAccessAdmin, loading } = useUserRole();

  useEffect(() => {
    if (loading) return;

    // Check access based on required level
    let hasAccess = false;

    switch (requiredAccess) {
      case "staff":
        hasAccess = isStaff;
        break;
      case "category-admin":
        hasAccess = isCategoryAdmin || isStaff;
        break;
      case "any-admin":
        hasAccess = canAccessAdmin;
        break;
    }

    if (!hasAccess) {
      // Redirect to dashboard if no access
      router.push("/dashboard");
    }
  }, [isStaff, isCategoryAdmin, canAccessAdmin, loading, requiredAccess, router]);

  // Show loading while checking access
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Checking access...</div>
        </div>
      </ProtectedRoute>
    );
  }

  // Check access
  let hasAccess = false;
  switch (requiredAccess) {
    case "staff":
      hasAccess = isStaff;
      break;
    case "category-admin":
      hasAccess = isCategoryAdmin || isStaff;
      break;
    case "any-admin":
      hasAccess = canAccessAdmin;
      break;
  }

  if (!hasAccess) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
