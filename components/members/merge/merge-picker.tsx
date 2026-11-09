/**
 * MergePicker (F3, 2026-11-09): an admin or treasurer chooses the two people
 * by phone number (any number they have, or the number of a Pay Bill payer
 * known only by its hash), sees who each is, then opens the preview.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GET_MEMBER_BY_PHONE } from "@/lib/graphql/queries";

interface Found {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  memberNumber: string | null;
}

type Lookup = { phone: string; member: Found | null } | null;

function Person({ title, lookup }: { title: string; lookup: Lookup }) {
  if (!lookup) return null;
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-xs text-muted-foreground">{title}</p>
      {lookup.member ? (
        <>
          <p className="font-medium">{lookup.member.fullName.trim() || "No name"}</p>
          <p className="text-muted-foreground">
            Member no. {lookup.member.memberNumber ?? "—"} · {lookup.member.phoneNumber ?? "Pay Bill number (hidden)"}
          </p>
        </>
      ) : (
        <p className="text-destructive">No one has {lookup.phone}</p>
      )}
    </div>
  );
}

export function MergePicker() {
  const router = useRouter();
  const client = useApolloClient();
  const [keepPhone, setKeepPhone] = useState("");
  const [dupPhone, setDupPhone] = useState("");
  const [keep, setKeep] = useState<Lookup>(null);
  const [dup, setDup] = useState<Lookup>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async (phone: string): Promise<Lookup> => {
    const { data } = await client.query<{ memberByPhone: Found | null }>({
      query: GET_MEMBER_BY_PHONE, variables: { phoneNumber: phone.trim() }, fetchPolicy: "network-only",
    });
    return { phone: phone.trim(), member: data?.memberByPhone ?? null };
  };

  const lookUp = async () => {
    setBusy(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([find(keepPhone), find(dupPhone)]);
      setKeep(a);
      setDup(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not look the numbers up");
    } finally {
      setBusy(false);
    }
  };

  const same = keep?.member && dup?.member && keep.member.id === dup.member.id;
  const ready = keep?.member && dup?.member && !same;

  return (
    <div className="space-y-4">
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => { e.preventDefault(); void lookUp(); }}>
        <div className="space-y-1">
          <Label htmlFor="keep-phone">Number of the record to keep</Label>
          <Input id="keep-phone" className="font-mono" placeholder="0712345678" value={keepPhone}
            onChange={(e) => { setKeepPhone(e.target.value); setKeep(null); }} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dup-phone">Number of the duplicate</Label>
          <Input id="dup-phone" className="font-mono" placeholder="0733000002" value={dupPhone}
            onChange={(e) => { setDupPhone(e.target.value); setDup(null); }} />
        </div>
        <Button type="submit" variant="outline" disabled={busy || !keepPhone.trim() || !dupPhone.trim()}>
          {busy ? "Finding..." : "Find"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {(keep || dup) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Person title="Keeps" lookup={keep} />
          <Person title="Merged in" lookup={dup} />
        </div>
      )}
      {same && <p className="text-sm text-destructive">Both numbers belong to the same person</p>}
      {ready && (
        <div className="flex justify-end">
          <Button onClick={() => router.push(`/admin/members/merge?survivor=${keep.member!.id}&duplicate=${dup.member!.id}`)}>
            Preview merge <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
