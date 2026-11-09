/**
 * DuplicateCandidates (MG-2): possible duplicate people, with the evidence,
 * each opening the merge preview. The record to keep defaults to the
 * registered one (not a guest), then the one with more gifts.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { POSSIBLE_DUPLICATE_MEMBERS } from "@/lib/graphql/member-merge";

interface Candidate {
  reason: string;
  giftCounts: number[];
  giftTotals: string[];
  members: { id: string; fullName: string; phoneNumber: string | null; memberNumber: string | null; isGuest: boolean }[];
}

export function keepFirst(c: Candidate): [string, string] {
  const [a, b] = c.members;
  const score = (i: number) => (c.members[i].isGuest ? 0 : 1_000_000) + (c.giftCounts[i] ?? 0);
  return score(0) >= score(1) ? [a.id, b.id] : [b.id, a.id];
}

export function DuplicateCandidates() {
  const { data, loading, error } = useQuery<{ possibleDuplicateMembers: { total: number; items: Candidate[] } }>(
    POSSIBLE_DUPLICATE_MEMBERS, { variables: { limit: 50, offset: 0 }, fetchPolicy: "network-only" },
  );
  if (loading && !data) return <Skeleton className="h-24 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  const items = data?.possibleDuplicateMembers.items ?? [];
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No likely duplicates found.</p>;
  return (
    <ul className="divide-y rounded-lg border" aria-label="Possible duplicates">
      {items.map((c) => {
        const [keep, merge] = keepFirst(c);
        return (
          <li key={c.members.map((m) => m.id).join("-")} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">
                {c.members.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && " · "}
                    {m.fullName.trim() || "No name"}
                    {m.isGuest && <Badge variant="outline" className="ml-1 text-xs">Guest</Badge>}
                    <span className="text-muted-foreground"> ({c.giftCounts[i] ?? 0} gifts)</span>
                  </span>
                ))}
              </p>
              <p className="text-xs text-muted-foreground">{c.reason}</p>
            </div>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })}
              href={`/admin/members/merge?survivor=${keep}&duplicate=${merge}`}>
              Review
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
