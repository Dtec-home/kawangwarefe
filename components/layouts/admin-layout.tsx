/**
 * Admin Dashboard Layout
 * Sprint 3: Admin Dashboard
 *
 * Sidebar navigation and header for admin pages
 * Role-based navigation: Full staff sees all, department admins see limited options
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
  FolderOpen,
  UserRound,
  Smartphone,
  Newspaper,
} from "lucide-react";
import { useState } from "react";
import { AdminBottomNav } from "@/components/layouts/admin-bottom-nav";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

type FeatureType = "overview" | "contributions" | "members" | "categories" | "groups" | "category-admins" | "reports" | "c2b-transactions" | "content";

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
  const { isStaff, isCategoryAdmin, isGroupAdmin, isContentAdmin, canAccessFeature, adminCategories, loading: roleLoading } = useUserRole();
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
    { name: "Departments", href: "/admin/categories", icon: FolderOpen, feature: "categories" },
    { name: "Groups", href: "/admin/groups", icon: UserRound, feature: "groups" },
    { name: "Department Admins", href: "/admin/category-admins", icon: Shield, feature: "category-admins" },
    { name: "Reports", href: "/admin/reports", icon: FileText, feature: "reports" },
    { name: "C2B / Pay Bill", href: "/admin/c2b-transactions", icon: Smartphone, feature: "c2b-transactions" },
    { name: "Church Content", href: "/admin/content", icon: Newspaper, feature: "content" },
  ];

  // Filter navigation based on user's role
  const navigation = allNavigation.filter((item) => canAccessFeature(item.feature));

  // Determine role badge
  const getRoleBadge = () => {
    if (isStaff) {
      return { text: "Staff Admin", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" };
    }
    if (isContentAdmin) {
      return { text: "Content Admin", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100" };
    }
    if (isCategoryAdmin) {
      return { text: "Department Admin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" };
    }
    if (isGroupAdmin) {
      return { text: "Group Admin", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100" };
    }
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Title */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <img
                    src="/logo.png"
                    alt="SDA Church"
                    className="object-contain w-full h-full"
                  />
                </div>
                <h1 className="text-xl font-bold">Church Admin</h1>
              </div>
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
              <span className={`inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full ${roleBadge.color}`}>
                {roleBadge.text}
              </span>
            )}
          </div>

          {/* Department Admin Scope Indicator */}
          {isCategoryAdmin && !isStaff && adminCategories.length > 0 && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 mb-2">
                <FolderKey className="h-3 w-3" />
                <span className="font-medium">Your Departments:</span>
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
          <nav className="flex-1 p-4 space-y-1">
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
                    className={`w-full justify-start transition-all ${isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted"
                      }`}
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
          <div className="p-4 border-t border-border">
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
        <header className="bg-card border-b border-border sticky top-0 z-30">
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
        <main className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <AdminBottomNav />
    </div>
  );
}
