/**
 * Member redirect page (MG-2).
 *
 * A merged (tombstoned) member's URL /admin/members/<id> redirects to the
 * survivor's URL. A live member with no profile page redirects back to the
 * members list. This keeps old links and bookmarks working after a merge.
 */

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { Skeleton } from "@/components/ui/skeleton";
import { MEMBER_TOMBSTONE_REDIRECT } from "@/lib/graphql/member-merge";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";

function MemberRedirectContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error } = useQuery<{
    memberTombstoneRedirect: { id: string; mergedIntoId: string | null } | null;
  }>(MEMBER_TOMBSTONE_REDIRECT, { variables: { memberId: id }, fetchPolicy: "network-only" });

  useEffect(() => {
    if (loading) return;
    if (error || !data?.memberTombstoneRedirect) {
      router.replace("/admin/members");
      return;
    }
    const { mergedIntoId } = data.memberTombstoneRedirect;
    if (mergedIntoId) {
      // Tombstone: redirect to survivor, preserving any hash/query the link carried
      router.replace(`/admin/members/${mergedIntoId}`);
    } else {
      // Live member — no profile page yet; send to the list
      router.replace("/admin/members");
    }
  }, [loading, data, error, router]);

  return (
    <div className="p-8 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export default function MemberPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <MemberRedirectContent />
    </AdminProtectedRoute>
  );
}
