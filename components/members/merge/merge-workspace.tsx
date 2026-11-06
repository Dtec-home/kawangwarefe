/**
 * MergeWorkspace (MG-2): preview a pair, confirm, merge. A stale preview is
 * refetched and shown again instead of merging blind.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { AlertCircle, ArrowLeftRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MEMBER_MERGE_PREVIEW, MERGE_MEMBERS } from "@/lib/graphql/member-merge";
import { MergeConfirmForm } from "./merge-confirm-form";
import { MergePreview } from "./merge-preview";
import type { MergePreviewData } from "./types";

interface MergeAnswer { mergeMembers: { success: boolean; message: string; code?: string | null } }

export function MergeWorkspace({ survivorId, duplicateId }: { survivorId: string; duplicateId: string }) {
  const router = useRouter();
  const [refusal, setRefusal] = useState<string | null>(null);
  const variables = { survivorId, duplicateId };
  const { data, loading, refetch } = useQuery<{ memberMergePreview: MergePreviewData | null }>(MEMBER_MERGE_PREVIEW, {
    variables, fetchPolicy: "network-only",
  });
  const [merge, { loading: merging }] = useMutation<MergeAnswer>(MERGE_MEMBERS);
  const preview = data?.memberMergePreview;

  if (loading && !data) return <Skeleton className="h-64 w-full" />;
  if (!preview) return <p className="text-sm text-muted-foreground">These members could not be found.</p>;

  const onConfirm = async (reason: string, confirmName: string) => {
    setRefusal(null);
    try {
      const { data: answered } = await merge({ variables: { ...variables, reason, confirmName, previewHash: preview.previewHash } });
      const result = answered?.mergeMembers;
      if (result?.success) {
        toast.success(result.message);
        router.push("/admin/members/merges");
        return;
      }
      setRefusal(result?.message ?? "The merge did not go through");
      if (result?.code === "PREVIEW_STALE") await refetch();
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : "The merge did not go through");
    }
  };

  return (
    <div className="space-y-6">
      <MergePreview preview={preview} />
      <div className="flex justify-end">
        <Button variant="ghost" size="sm"
          onClick={() => router.push(`/admin/members/merge?survivor=${duplicateId}&duplicate=${survivorId}`)}>
          <ArrowLeftRight className="mr-1 h-4 w-4" /> Keep the other record instead
        </Button>
      </div>
      {refusal && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{refusal}</AlertDescription>
        </Alert>
      )}
      <MergeConfirmForm survivorName={preview.survivor.fullName} onConfirm={onConfirm}
        disabled={preview.blockers.length > 0} busy={merging} />
    </div>
  );
}
