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
  Receipt,
  UsersRound,
  Info,
} from "lucide-react";
import { useState } from "react";
import { AdminBottomNav } from "@/components/layouts/admin-bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge, type RoleTone } from "@/components/ui/status-badge";
import { toast } from "sonner";

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

  // Determine role badge — tokenised tones for theme-aware contrast (F2.4)
  const getRoleBadge = (): { text: string; tone: RoleTone } | null => {
    if (isStaff) return { text: "Staff Admin",      tone: "primary" };
    if (isContentAdmin) return { text: "Content Admin", tone: "info" };
    if (isCategoryAdmin) return { text: "Dept Admin",   tone: "warning" };
    if (isGroupAdmin)    return { text: "Group Admin",  tone: "success" };
    if (canSendBulkMessage) return { text: "Messaging",  tone: "neutral" };
    return null;
  };

  // Avatar initials from full name (F2.2)
  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Title */}
          <div className="px-4 py-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <img
                    src="/logo.png"
                    alt="SDA Church"
                    className="object-contain w-full h-full"
                  />
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground">Church Admin</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Role badge — solid fill for legibility on the dark sidebar rail
                (soft RoleBadge tints are too low-contrast here) */}
            {roleBadge && (
              <RoleBadge
                tone={roleBadge.tone}
                className="mt-2 font-semibold bg-sidebar-accent text-sidebar-accent-foreground"
              >
                {roleBadge.text}
              </RoleBadge>
            )}
          </div>

          {/* Department Admin Scope Indicator */}
          {isCategoryAdmin && !isStaff && adminCategories.length > 0 && (
            <div className="px-4 py-3 bg-sidebar-accent/25 border-b border-sidebar-border">
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/80 mb-2">
                <FolderKey className="h-3 w-3" />
                <span className="font-medium">Your Departments:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {adminCategories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-sidebar-accent text-sidebar-accent-foreground"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {roleLoading ? (
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg bg-sidebar-accent/30" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {navGroups.map((group, gi) => (
                  <div key={gi} className="space-y-0.5">
                    {/* F2.3 — subtle separator between groups */}
                    {gi > 0 && (
                      <div className="h-px bg-sidebar-border mx-2 mb-3" />
                    )}
                    {group.label && (
                      <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 select-none">
                        {group.label}
                      </p>
                    )}
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.name}
                          variant="ghost"
                          className={`w-full justify-start h-9 px-3 relative transition-all rounded-lg ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold hover:bg-sidebar-accent"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                          }`}
                          onClick={() => {
                            router.push(item.href);
                            setSidebarOpen(false);
                          }}
                        >
                          {/* F2.5 — left accent bar for active item */}
                          {isActive && (
                            <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-sidebar-primary rounded-r-full" />
                          )}
                          <Icon className={`h-4 w-4 mr-2.5 flex-shrink-0 ${
                            isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/50"
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

          {/* User info — F2.2 initials fallback */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <div
                aria-hidden
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-sidebar-primary flex items-center justify-center"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-sidebar-primary-foreground">
                    {getInitials(user?.fullName)}
                  </span>
                )}
              </div>
              <div className="text-sm min-w-0">
                <p className="font-medium truncate text-sidebar-foreground">{user?.fullName}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.phoneNumber}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="mobile-sm"
              className="w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

              {/* Right: ThemeToggle (F8.1) + about + member-view switch */}
              <div className="flex items-center gap-1.5">
                <ThemeToggle variant="button" size="icon" />
                <Button
                  variant="ghost"
                  size="icon-mobile"
                  className="sm:hidden"
                  onClick={() => router.push('/about')}
                  aria-label="About"
                >
                  <Info className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => router.push('/about')}
                  aria-label="About"
                >
                  <Info className="h-4 w-4 mr-2" />
                  About
                </Button>
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
                  Member View
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
