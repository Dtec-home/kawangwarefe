"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, HandCoins, Calendar, Video, MoreHorizontal, BookOpen, Bell, LogIn, LayoutDashboard, UserRound, X, LogOut, Users, Heart } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const primaryLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/contribute", label: "Give", icon: Heart },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/sermons", label: "Sermons", icon: Video },
];

const guestMoreLinks = [
  { href: "/announcements", label: "Announcements", icon: Bell },
  { href: "/devotionals", label: "Devotionals", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const guestPrimaryLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/contribute", label: "Give", icon: HandCoins },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/sermons", label: "Sermons", icon: Video },
  ];

  const memberPrimaryLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/contribute", label: "Give", icon: HandCoins },
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "#more", label: "More", icon: MoreHorizontal },
  ];

  const primaryLinks = isAuthenticated ? memberPrimaryLinks : guestPrimaryLinks;
  const moreLinks = isAuthenticated
    ? [
        { href: "/prayers/new", label: "Prayer Request", icon: Heart },
        { href: "/profile/family", label: "Family", icon: Users },
        { href: "/announcements", label: "Announcements", icon: Bell },
        { href: "/devotionals", label: "Devotionals", icon: BookOpen },
      ]
    : guestMoreLinks;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* More menu overlay — F3.3 animated slide-up sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-card border-t border-border shadow-2xl rounded-t-2xl p-4 space-y-1 animate-slide-up-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* F3.3 drag handle */}
            <div className="flex justify-center mb-1 -mt-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Theme Toggle in More Menu */}
            <div className="px-4 py-3 rounded-lg border border-border bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle variant="button" size="icon" />
              </div>
            </div>
            {moreLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <>
                <button
                  onClick={async () => {
                    setMoreOpen(false);
                    await logout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-muted transition-colors w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="h-5 w-5" />
                Member Login
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const isMoreButton = link.label === "More";
            const active = isActive(link.href);
            if (isMoreButton) {
              return (
                <button
                  key={link.label}
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex flex-col items-center justify-center min-w-[3rem] py-1.5 px-2 transition-colors flex-1 h-full gap-0.5 ${
                    moreOpen ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className={`flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200 ${
                    moreOpen ? "bg-primary/15" : ""
                  }`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium leading-none">More</span>
                </button>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center min-w-[3rem] py-1.5 px-2 transition-colors flex-1 h-full gap-0.5 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className={`flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200 ${
                  active ? "bg-primary/15" : ""
                }`}>
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                </span>
                <span className="text-xs font-medium leading-none">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
