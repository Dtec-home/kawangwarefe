/**
 * PhoneList (MP-2): a member's numbers, primary first. Second lines can be
 * made primary (not a hidden Pay Bill number) or removed; the primary has no
 * actions. Presentational: callers wire the mutations.
 */

"use client";

import { Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { displayPhone, type MemberPhone } from "./types";

export function PhoneList({
  phones,
  onMakePrimary,
  onRemove,
  readOnly = false,
  busyId = null,
}: {
  phones: MemberPhone[];
  onMakePrimary?: (id: string) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
  busyId?: string | null;
}) {
  if (phones.length === 0) {
    return <p className="text-sm text-muted-foreground">No numbers on file.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border" aria-label="Phone numbers">
      {phones.map((phone) => {
        const shown = displayPhone(phone.phoneNumber);
        const busy = busyId === phone.id;
        return (
          <li key={phone.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
            <span className={phone.phoneNumber ? "font-mono text-sm" : "text-sm text-muted-foreground"}>{shown}</span>
            {phone.label && <Badge variant="outline">{phone.label}</Badge>}
            {phone.isPrimary && <Badge>Primary</Badge>}
            {!phone.verified && <Badge variant="secondary">Not confirmed</Badge>}
            {!readOnly && !phone.isPrimary && (
              <span className="ml-auto flex gap-1">
                {phone.phoneNumber && onMakePrimary && (
                  <Button size="sm" variant="ghost" disabled={busy} aria-label={`Make ${shown} primary`}
                    onClick={() => onMakePrimary(phone.id)}>
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onRemove && (
                  <Button size="sm" variant="ghost" disabled={busy} aria-label={`Remove ${shown}`}
                    onClick={() => onRemove(phone.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
