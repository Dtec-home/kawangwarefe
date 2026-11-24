/**
 * /admin/whatsapp-posts — the church-wide WhatsApp totals-post settings and
 * the church group for announcements (WA-3, US-22/US-23, E3/E4/E8).
 *
 * Admins only: treasurers and pastors are staff but the server refuses them
 * (`fundraising/api/post_settings.py`), so they get a plain message here.
 */

"use client";

import { ShieldAlert } from "lucide-react";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ChurchPostSettingsScreen } from "@/components/whatsapp-posts/church-post-settings";
import { useUserRole } from "@/lib/hooks/use-user-role";

function AdminsOnly() {
  const { isAdmin, loading } = useUserRole();
  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!isAdmin) {
    return (
      <Empty
        icon={ShieldAlert}
        title="Only admins change the WhatsApp posts"
        description="Ask a church admin to change when the totals post goes or what it says."
      />
    );
  }
  return <ChurchPostSettingsScreen />;
}

export default function WhatsAppPostsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <AdminLayout>
        <AdminsOnly />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
