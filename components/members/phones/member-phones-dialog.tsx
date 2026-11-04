/**
 * MemberPhonesDialog (MP-2): the members-page action for a member's numbers.
 */

"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemberPhonesPanel } from "./member-phones-panel";

export function MemberPhonesDialog({
  member,
  compact = false,
}: {
  member: { id: string; fullName: string };
  compact?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant={compact ? "ghost" : "outline"} title="Phone numbers" aria-label={`Phone numbers of ${member.fullName}`}>
          <Phone className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Phone numbers: {member.fullName}</DialogTitle>
          <DialogDescription>
            Any of these numbers signs {member.fullName} in and credits their giving. Receipts go to the primary.
          </DialogDescription>
        </DialogHeader>
        <MemberPhonesPanel memberId={member.id} mode="admin" />
      </DialogContent>
    </Dialog>
  );
}
