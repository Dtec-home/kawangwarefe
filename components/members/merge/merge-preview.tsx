/**
 * MergePreview (MG-2): the two records side by side, what moves, how clashes
 * resolve, and the money that must match afterwards. Presentational.
 */

"use client";

import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { moveText, wholeKes, type MergeMember, type MergePreviewData } from "./types";

function Side({ member, title }: { member: MergeMember; title: string }) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <Badge variant={title === "Keeps" ? "default" : "secondary"} className="w-fit">{title}</Badge>
        <CardTitle className="text-base">{member.fullName.trim() || "No name"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>Member no. {member.memberNumber ?? "—"}</p>
        <p className="font-mono">{member.phoneNumber ?? "Pay Bill number (hidden)"}</p>
        {member.isGuest && <p>Guest record</p>}
      </CardContent>
    </Card>
  );
}

export function MergePreview({ preview }: { preview: MergePreviewData }) {
  const { totals } = preview;
  return (
    <div className="space-y-4">
      {preview.blockers.length > 0 && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {preview.blockers.map((b) => <p key={b}>{b}</p>)}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Side member={preview.duplicate} title="Merged in" />
        <ArrowRight className="mx-auto h-5 w-5 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" />
        <Side member={preview.survivor} title="Keeps" />
      </div>
      <section aria-label="What moves" className="space-y-2">
        <h3 className="text-sm font-medium">What moves to {preview.survivor.fullName.trim()}</h3>
        <ul className="flex flex-wrap gap-2">
          {preview.moves.map((move) => <li key={move.key}><Badge variant="outline">{moveText(move)}</Badge></li>)}
        </ul>
      </section>
      {preview.conflicts.length > 0 && (
        <section aria-label="Clashes" className="space-y-2">
          <h3 className="text-sm font-medium">Clashes</h3>
          <ul className="space-y-2 text-sm">
            {preview.conflicts.map((c) => (
              <li key={c.description} className="rounded-md border p-2">
                <p>{c.description}</p>
                <p className="text-muted-foreground">{c.resolution}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label="Money check" className="rounded-md bg-muted p-3 text-sm">
        <p className="font-medium">These totals must be the same after the merge, or nothing changes:</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <dt className="text-muted-foreground">Given</dt><dd>{wholeKes(totals.givenAmount)}</dd>
          <dt className="text-muted-foreground">Gifts</dt><dd>{totals.giftCount}</dd>
          <dt className="text-muted-foreground">Receipts</dt><dd>{totals.receiptCount}</dd>
          <dt className="text-muted-foreground">Pledged</dt><dd>{wholeKes(totals.pledgedAmount)}</dd>
        </dl>
      </section>
    </div>
  );
}
