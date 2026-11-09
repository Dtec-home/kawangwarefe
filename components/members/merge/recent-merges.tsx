/**
 * RecentMerges (MG-2, M5): merges with an Undo that first shows what goes
 * back, including gifts since the merge from the returned numbers.
 */

"use client";

import { useEffect, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MEMBER_MERGES, MEMBER_MERGE_UNDO_PREVIEW, UNDO_MEMBER_MERGE } from "@/lib/graphql/member-merge";
import { moveText, type MemberMergeRecord, type MergeMove } from "./types";
import { Users } from "lucide-react";

interface UndoPreview { movesBack: MergeMove[]; sinceMergeGoingBack: MergeMove[]; sinceMergeStaying: MergeMove[]; blockers: string[] }

function UndoDialog({ merge, onClose }: { merge: MemberMergeRecord; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [load, { data }] = useLazyQuery<{ memberMergeUndoPreview: UndoPreview | null }>(MEMBER_MERGE_UNDO_PREVIEW, { fetchPolicy: "network-only" });
  const [undo, { loading }] = useMutation<{ undoMemberMerge: { success: boolean; message: string } }>(UNDO_MEMBER_MERGE, {
    refetchQueries: [{ query: MEMBER_MERGES }],
  });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void load({ variables: { mergeId: merge.id } });
  }, [merge.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = data?.memberMergeUndoPreview;
  const going = preview?.sinceMergeGoingBack.reduce((n, m) => n + m.count, 0) ?? 0;

  const run = async () => {
    setError(null);
    const { data: answered } = await undo({ variables: { mergeId: merge.id, reason } });
    if (answered?.undoMemberMerge.success) {
      toast.success(answered.undoMemberMerge.message);
      onClose();
    } else {
      setError(answered?.undoMemberMerge.message ?? "The undo did not go through");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Undo merge</DialogTitle>
          <DialogDescription>
            {merge.duplicate.fullName.trim() || "The duplicate"} becomes a separate member again.
          </DialogDescription>
        </DialogHeader>
        {preview ? (
          <div className="space-y-2 text-sm">
            <p>Goes back: {preview.movesBack.map(moveText).join(", ") || "nothing"}</p>
            {going > 0 && <p>{going} {going === 1 ? "gift" : "gifts"} since the merge {going === 1 ? "goes" : "go"} back with its number</p>}
            {preview.blockers.length > 0 && (
              <Alert variant="destructive"><AlertCircle className="h-4 w-4" />
                <AlertDescription>{preview.blockers.join("; ")}</AlertDescription></Alert>
            )}
          </div>
        ) : <Skeleton className="h-12 w-full" />}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-1">
          <Label htmlFor="undo-reason">Why undo this merge?</Label>
          <Textarea id="undo-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={run}
            disabled={loading || !reason.trim() || !preview || preview.blockers.length > 0}>
            Undo merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecentMerges() {
  const { data, loading } = useQuery<{ memberMerges: MemberMergeRecord[] }>(MEMBER_MERGES, { fetchPolicy: "network-only" });
  const [undoing, setUndoing] = useState<MemberMergeRecord | null>(null);
  if (loading && !data) return <Skeleton className="h-32 w-full" />;
  const merges = data?.memberMerges ?? [];
  if (merges.length === 0) return <Empty icon={Users} title="No merges yet" description="Merged members appear here, each with Undo." />;
  return (
    <>
      <ul className="divide-y rounded-lg border">
        {merges.map((merge) => (
          <li key={merge.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{merge.duplicate.fullName.trim() || "No name"} → {merge.survivor.fullName.trim()}</p>
              <p className="text-muted-foreground">
                {merge.reason} · {merge.mergedBy} · {new Date(merge.executedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
              </p>
            </div>
            {merge.status === "reversed"
              ? <Badge variant="secondary">Undone</Badge>
              : <Button size="sm" variant="outline" onClick={() => setUndoing(merge)}>Undo</Button>}
          </li>
        ))}
      </ul>
      {undoing && <UndoDialog merge={undoing} onClose={() => setUndoing(null)} />}
    </>
  );
}
