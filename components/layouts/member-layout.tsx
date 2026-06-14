"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layouts/bottom-nav";
import {
  LayoutDashboard,
  UserRound,
  Heart,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  Newspaper,
} from "lucide-react";
import toast from "react-hot-toast";

interface MemberLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const memberNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: UserRound },
  { name: "Give", href: "/contribute", icon: Heart },
  { name: "Prayer Request", href: "/prayers/new", icon: Heart },
  { name: "Family", href: "/profile/family", icon: Users },
];

export function MemberLayout({ children }: MemberLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { canAccessAdmin, canAccessContent } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const extraAdminLinks: NavItem[] = [
    ...(canAccessAdmin ? [{ name: "Admin Panel", href: "/admin", icon: Shield }] : []),
    ...(canAccessContent ? [{ name: "Church Content", href: "/admin/content", icon: Newspaper }] : []),
  ];

  return (
    <div className="h-dvh overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image src="/logo.png" alt="SDA Church" fill className="object-contain" />
                </div>
                <h1 className="text-xl font-bold">Church Member</h1>
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
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {memberNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Button
                  key={item.href}
                  variant={active ? "secondary" : "ghost"}
                  className={`w-full justify-start transition-all relative ${
                    active
                      ? "bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 text-teal-900 dark:text-emerald-100 font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-600 to-emerald-600" />
                  )}
                  <Icon className={`h-4 w-4 mr-3 ${active ? "text-teal-600 dark:text-emerald-400" : ""}`} />
                  {item.name}
                </Button>
              );
            })}

            {extraAdminLinks.length > 0 && (
              <div className="pt-4 mt-4 border-t border-border space-y-1">
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Admin shortcuts
                </p>
                {extraAdminLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Button
                      key={item.href}
                      variant={active ? "secondary" : "ghost"}
                      className={`w-full justify-start transition-all relative ${
                        active
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-900 dark:text-blue-100 font-semibold"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => {
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      {active && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600" />
                      )}
                      <Icon className={`h-4 w-4 mr-3 ${active ? "text-blue-600 dark:text-blue-400" : ""}`} />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            <div className="text-sm min-w-0">
              <p className="font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.phoneNumber}</p>
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

      <div className="flex h-full flex-col lg:pl-64">
        <header className="flex-shrink-0 bg-card border-b border-border z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between relative">
              <Button
                variant="ghost"
                size="icon-mobile"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {/* Centred logo + name on mobile — sidebar already shows this on desktop */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 lg:hidden pointer-events-none">
                <Image src="/logo.png" width={22} height={22} alt="" className="object-contain" />
                <span className="font-semibold text-sm">SDA Kawangware</span>
              </div>
              {/* Desktop: user name on right */}
              <div className="text-sm text-muted-foreground hidden lg:block">
                {user?.fullName}
              </div>
              {/* Balances hamburger width on mobile */}
              <div className="w-11 lg:hidden" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
