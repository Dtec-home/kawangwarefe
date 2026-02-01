/**
 * Admin Dashboard Layout
 * Sprint 3: Admin Dashboard
 *
 * Sidebar navigation and header for admin pages
 * Role-based navigation: Full staff sees all, Category admins see limited options
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  FolderKey,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

type FeatureType = "overview" | "contributions" | "members" | "category-admins" | "reports";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature: FeatureType;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isStaff, isCategoryAdmin, canAccessFeature, adminCategories, loading: roleLoading } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  // All possible navigation items
  const allNavigation: NavItem[] = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard, feature: "overview" },
    { name: "Contributions", href: "/admin/contributions", icon: DollarSign, feature: "contributions" },
    { name: "Members", href: "/admin/members", icon: Users, feature: "members" },
    { name: "Category Admins", href: "/admin/category-admins", icon: Shield, feature: "category-admins" },
    { name: "Reports", href: "/admin/reports", icon: FileText, feature: "reports" },
  ];

  // Filter navigation based on user's role
  const navigation = allNavigation.filter((item) => canAccessFeature(item.feature));

  // Determine role badge
  const getRoleBadge = () => {
    if (isStaff) {
      return { text: "Staff Admin", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" };
    }
    if (isCategoryAdmin) {
      return { text: "Category Admin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" };
    }
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Title */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Church Admin</h1>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Role badge */}
            {roleBadge && (
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${roleBadge.color}`}>
                {roleBadge.text}
              </span>
            )}
          </div>

          {/* Category Admin Scope Indicator */}
          {isCategoryAdmin && !isStaff && adminCategories.length > 0 && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 mb-2">
                <FolderKey className="h-3 w-3" />
                <span className="font-medium">Your Categories:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {adminCategories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {roleLoading ? (
              <div className="text-sm text-muted-foreground p-2">Loading...</div>
            ) : (
              navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                );
              })
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm mb-3">
              <p className="font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.phoneNumber}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                >
                  Member View
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
