/** /admin/members/merges (M5): recent merges, each with Undo. Admins and treasurers. */

"use client";

import Link from "next/link";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { RecentMerges } from "@/components/members/merge/recent-merges";

export default function RecentMergesPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Recent merges"
            description="Undo puts every record back, including gifts since the merge from the numbers that go back."
            actions={<Link className={buttonVariants({ variant: "outline" })} href="/admin/members/merge">Merge members</Link>}
          />
          <Card><CardContent className="pt-6"><RecentMerges /></CardContent></Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
