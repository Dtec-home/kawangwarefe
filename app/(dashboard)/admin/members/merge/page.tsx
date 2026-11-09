/**
 * /admin/members/merge (F3): pick two people by phone number (or from the
 * possible duplicates), preview, confirm. Admins and treasurers.
 */

"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { DuplicateCandidates } from "@/components/members/merge/duplicate-candidates";
import { MergePicker } from "@/components/members/merge/merge-picker";
import { MergeWorkspace } from "@/components/members/merge/merge-workspace";
import { useUserRole } from "@/lib/hooks/use-user-role";

function MergeContent() {
  const params = useSearchParams();
  const { isAdmin, isTreasurer, loading } = useUserRole();
  const survivor = params.get("survivor");
  const duplicate = params.get("duplicate");

  if (!loading && !isAdmin && !isTreasurer) {
    return <p className="text-sm text-muted-foreground">Merging members needs the admin or treasurer role.</p>;
  }
  if (survivor && duplicate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merge preview</CardTitle>
          <CardDescription>Everything below moves to the record that keeps. Totals are checked before anything changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <MergeWorkspace key={`${survivor}-${duplicate}`} survivorId={survivor} duplicateId={duplicate} />
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose the two records</CardTitle>
          <CardDescription>Enter a phone number of each. A Pay Bill payer known only by their number can be found the same way.</CardDescription>
        </CardHeader>
        <CardContent><MergePicker /></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Possible duplicates</CardTitle>
          <CardDescription>Records with the same full name or the same department number. Review before merging.</CardDescription>
        </CardHeader>
        <CardContent><DuplicateCandidates /></CardContent>
      </Card>
    </div>
  );
}

export default function MergeMembersPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Merge duplicate members"
            description="The same person registered twice becomes one record, with nothing lost."
            actions={<Link className={buttonVariants({ variant: "outline" })} href="/admin/members/merges">Recent merges</Link>}
          />
          <Suspense><MergeContent /></Suspense>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
