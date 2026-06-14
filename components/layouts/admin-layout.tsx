/**
 * Admin Dashboard Layout
 * Sprint 3: Admin Dashboard
 *
 * Sidebar navigation and header for admin pages
 * Role-based navigation: Full staff sees all, department admins see limited options
 */

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/lib/auth/auth-context";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { GET_ME } from "@/lib/graphql/profile-mutations";
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
  MessageSquare,
  Heart,
  UserCircle,
  Receipt,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { AdminBottomNav } from "@/components/layouts/admin-bottom-nav";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

type FeatureType = "overview" | "contributions" | "members" | "categories" | "groups" | "category-admins" | "reports" | "c2b-transactions" | "content" | "messaging" | "prayers" | "expenses" | "leaders";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature: FeatureType;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface MeAvatarData {
  me: { id: string; avatarUrl: string | null } | null;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isStaff, isCategoryAdmin, isGroupAdmin, isContentAdmin, canSendBulkMessage, canAccessFeature, adminCategories, loading: roleLoading } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Errors ignored — the sidebar falls back to the user-initial icon if the
  // authenticated member can't be loaded.
  const { data: meData } = useQuery<MeAvatarData>(GET_ME, {
    errorPolicy: "ignore",
    fetchPolicy: "cache-first",
  });
  const avatarUrl = meData?.me?.avatarUrl ?? null;

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  // Navigation grouped by function — reduces cognitive load vs flat list of 11
  const allNavGroups: NavGroup[] = [
    {
      items: [
        { name: "Overview",      href: "/admin",               icon: LayoutDashboard, feature: "overview" },
        { name: "Contributions", href: "/admin/contributions", icon: DollarSign,      feature: "contributions" },
        { name: "Members",       href: "/admin/members",       icon: Users,           feature: "members" },
      ],
    },
    {
      label: "Finance",
      items: [
        { name: "Reports",      href: "/admin/reports",          icon: FileText,  feature: "reports" },
        { name: "Expenses",     href: "/admin/expenses",         icon: Receipt,   feature: "expenses" },
        { name: "C2B / M-Pesa", href: "/admin/c2b-transactions", icon: Smartphone, feature: "c2b-transactions" },
      ],
    },
    {
      label: "Organisation",
      items: [
        { name: "Departments",    href: "/admin/categories",     icon: FolderOpen, feature: "categories" },
        { name: "Groups",         href: "/admin/groups",         icon: UserRound,  feature: "groups" },
        { name: "Dept. Admins",   href: "/admin/category-admins", icon: Shield,   feature: "category-admins" },
      ],
    },
    {
      label: "Engagement",
      items: [
        { name: "Church Content", href: "/admin/content",   icon: Newspaper,    feature: "content" },
        { name: "Leaders",        href: "/admin/leaders",   icon: UsersRound,    feature: "leaders" },
        { name: "Messaging",      href: "/admin/messaging", icon: MessageSquare, feature: "messaging" },
        { name: "Prayers",        href: "/admin/prayers",   icon: Heart,         feature: "prayers" },
      ],
    },
  ];

  // Filter each group's items by role; drop groups with no accessible items
  const navGroups = allNavGroups
    .map(g => ({ ...g, items: g.items.filter(i => canAccessFeature(i.feature)) }))
    .filter(g => g.items.length > 0);

  // Determine role badge
  const getRoleBadge = () => {
    if (isStaff) {
      return {
        text: "Staff Admin",
        color: "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 dark:from-purple-900 dark:to-purple-800 dark:text-purple-100",
        icon: "bg-purple-600"
      };
    }
    if (isContentAdmin) {
      return {
        text: "Content Admin",
        color: "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 dark:from-indigo-900 dark:to-indigo-800 dark:text-indigo-100",
        icon: "bg-indigo-600"
      };
    }
    if (isCategoryAdmin) {
      return {
        text: "Department Admin",
        color: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-100",
        icon: "bg-blue-600"
      };
    }
    if (isGroupAdmin) {
      return {
        text: "Group Admin",
        color: "bg-gradient-to-r from-teal-50 to-emerald-100 text-teal-800 dark:from-teal-900 dark:to-emerald-800 dark:text-teal-100",
        icon: "bg-gradient-to-r from-teal-600 to-emerald-600"
      };
    }
    if (canSendBulkMessage) {
      return {
        text: "Messaging Admin",
        color: "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-800 dark:from-violet-900 dark:to-violet-800 dark:text-violet-100",
        icon: "bg-violet-600"
      };
    }
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="h-dvh overflow-hidden bg-background">
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
          <div className="px-4 py-4 border-b border-border">
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
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 mb-2">
                <FolderKey className="h-3 w-3" />
                <span className="font-medium">Your Departments:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {adminCategories.map((cat, idx) => {
                  const colors = [
                    { bg: 'bg-gradient-to-r from-teal-100 to-teal-50', text: 'text-teal-800', dark: 'dark:from-teal-900/30 dark:to-teal-800/20 dark:text-teal-300' },
                    { bg: 'bg-gradient-to-r from-emerald-100 to-emerald-50', text: 'text-emerald-800', dark: 'dark:from-emerald-900/30 dark:to-emerald-800/20 dark:text-emerald-300' },
                    { bg: 'bg-gradient-to-r from-blue-100 to-blue-50', text: 'text-blue-800', dark: 'dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-300' },
                    { bg: 'bg-gradient-to-r from-purple-100 to-purple-50', text: 'text-purple-800', dark: 'dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-300' },
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <span
                      key={cat.id}
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${color.bg} ${color.text} ${color.dark}`}
                    >
                      {cat.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {roleLoading ? (
              <div className="text-sm text-muted-foreground px-2 py-1">Loading...</div>
            ) : (
              <div className="space-y-5">
                {navGroups.map((group, gi) => (
                  <div key={gi} className="space-y-0.5">
                    {group.label && (
                      <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                        {group.label}
                      </p>
                    )}
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.name}
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start h-9 px-2 relative transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 text-teal-900 dark:text-emerald-100 font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                          onClick={() => {
                            router.push(item.href);
                            setSidebarOpen(false);
                          }}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-teal-600 to-emerald-600 rounded-r-full" />
                          )}
                          <Icon className={`h-4 w-4 mr-2.5 flex-shrink-0 ${
                            isActive ? "text-teal-600 dark:text-emerald-400" : "text-muted-foreground"
                          }`} />
                          <span className="text-sm">{item.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div
                aria-hidden
                className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-sm min-w-0">
                <p className="font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.phoneNumber}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="mobile-sm"
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
      <div className="flex h-full flex-col lg:pl-64">
        {/* Header */}
        <header className="flex-shrink-0 bg-card border-b border-border z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between relative">
              {/* Left: hamburger (mobile) */}
              <div>
                <Button
                  variant="ghost"
                  size="icon-mobile"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Centre: logo + title on mobile only */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 lg:hidden pointer-events-none">
                <img src="/logo.png" className="h-6 w-6 object-contain" alt="" />
                <span className="font-semibold text-sm">Church Admin</span>
              </div>

              {/* Right: icon-only on mobile, full text on sm+ */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-mobile"
                  className="sm:hidden"
                  onClick={() => router.push('/dashboard')}
                  aria-label="Switch to member view"
                >
                  <UserRound className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => router.push('/dashboard')}
                  aria-label="Switch to member view"
                >
                  <UserRound className="h-4 w-4 mr-2" />
                  Switch to Member View
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <AdminBottomNav />
    </div>
  );
}
