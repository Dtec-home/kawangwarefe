"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, DollarSign, Users, FileText, MoreHorizontal, FolderOpen, UserRound, Shield, Smartphone, Newspaper, X } from "lucide-react";
import { useState } from "react";
import { useUserRole } from "@/lib/hooks/use-user-role";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryAdminLinks: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/contributions", label: "Funds", icon: DollarSign },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
];

const moreAdminLinks: NavItem[] = [
  { href: "/admin/categories", label: "Departments", icon: FolderOpen },
  { href: "/admin/groups", label: "Groups", icon: UserRound },
  { href: "/admin/category-admins", label: "Dept. Admins", icon: Shield },
  { href: "/admin/c2b-transactions", label: "C2B / Pay Bill", icon: Smartphone },
  { href: "/admin/content", label: "Content", icon: Newspaper },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccessFeature } = useUserRole();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const featureMap: Record<string, string> = {
    "/admin": "overview",
    "/admin/contributions": "contributions",
    "/admin/members": "members",
    "/admin/reports": "reports",
    "/admin/categories": "categories",
    "/admin/groups": "groups",
    "/admin/category-admins": "category-admins",
    "/admin/c2b-transactions": "c2b-transactions",
    "/admin/content": "content",
  };

  const visiblePrimary = primaryAdminLinks.filter(
    (link) => canAccessFeature(featureMap[link.href] as never)
  );

  const visibleMore = moreAdminLinks.filter(
    (link) => canAccessFeature(featureMap[link.href] as never)
  );

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg rounded-t-2xl p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-muted-foreground">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            {visibleMore.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    setMoreOpen(false);
                    router.push(link.href);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {visiblePrimary.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`flex flex-col items-center justify-center min-w-[3rem] py-1 px-2 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] mt-0.5 font-medium">{link.label}</span>
              </button>
            );
          })}
          {visibleMore.length > 0 && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center justify-center min-w-[3rem] py-1 px-2 transition-colors ${
                moreOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
