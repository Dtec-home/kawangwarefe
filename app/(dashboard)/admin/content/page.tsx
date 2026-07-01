/**
 * Church Content Management Hub
 * Central page for managing all church content:
 * Announcements, Devotionals, Events, and YouTube Videos
 */

"use client";

import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Megaphone,
  BookOpen,
  CalendarDays,
  Youtube,
  ArrowRight,
} from "lucide-react";

const contentSections = [
  {
    title: "Announcements",
    description:
      "Create and manage church announcements. Control visibility, set priority, and keep the congregation informed.",
    href: "/admin/announcements",
    icon: Megaphone,
    color: "text-[var(--chart-4)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-4)_12%,transparent)]",
    border: "border-[color-mix(in_oklch,var(--chart-4)_30%,transparent)]",
  },
  {
    title: "Devotionals",
    description:
      "Publish daily or weekly devotionals. Add scripture references, reflections, and spiritual content for members.",
    href: "/admin/devotionals",
    icon: BookOpen,
    color: "text-[var(--chart-3)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-3)_12%,transparent)]",
    border: "border-[color-mix(in_oklch,var(--chart-3)_30%,transparent)]",
  },
  {
    title: "Events",
    description:
      "Schedule and manage church events. Set dates, locations, and details for upcoming activities and services.",
    href: "/admin/events",
    icon: CalendarDays,
    color: "text-[var(--chart-2)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-2)_12%,transparent)]",
    border: "border-[color-mix(in_oklch,var(--chart-2)_30%,transparent)]",
  },
  {
    title: "YouTube Videos",
    description:
      "Manage sermon recordings and church videos. Sync from YouTube, feature videos, and organize content.",
    href: "/admin/youtube",
    icon: Youtube,
    color: "text-[var(--chart-5)]",
    bg: "bg-[color-mix(in_oklch,var(--chart-5)_12%,transparent)]",
    border: "border-[color-mix(in_oklch,var(--chart-5)_30%,transparent)]",
  },
];

function ContentHubPage() {
  const router = useRouter();

  return (
    <AdminProtectedRoute requiredAccess="content-admin">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Church Content"
            description="Manage all church content — announcements, devotionals, events, and videos — from one place."
          />

          {/* Content Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {contentSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.title}
                  className={`group cursor-pointer transition-all hover:shadow-md border ${section.border}`}
                  onClick={() => router.push(section.href)}
                >
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div
                      className={`rounded-lg p-3 ${section.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center justify-between text-lg">
                        {section.title}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </CardTitle>
                      <CardDescription className="mt-1.5">
                        {section.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

export default ContentHubPage;
