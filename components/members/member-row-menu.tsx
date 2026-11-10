"use client";

/**
 * The "⋯" menu on a member row (F3 UX): Merge… (admins and treasurers; opens
 * the merge page with this member's number as the record to keep), then
 * Activate/Deactivate and Delete.
 */

import Link from "next/link";
import { GitMerge, MoreHorizontal, Trash2, UserCheck, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowMember {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  isActive: boolean;
}

interface MemberRowMenuProps<M extends RowMember> {
  member: M;
  canMerge: boolean;
  onToggleStatus: (member: M) => void;
  onDelete: (member: M) => void;
  /** Wider trigger for the mobile card layout. */
  variant?: "ghost" | "outline";
}

export function MemberRowMenu<M extends RowMember>({
  member, canMerge, onToggleStatus, onDelete, variant = "ghost",
}: MemberRowMenuProps<M>) {
  const mergeHref = `/admin/members/merge${member.phoneNumber ? `?keep=${encodeURIComponent(member.phoneNumber)}` : ""}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant={variant} aria-label={`More actions for ${member.fullName}`} title="More actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canMerge && (
          <>
            <DropdownMenuItem asChild>
              <Link href={mergeHref}>
                <GitMerge className="h-4 w-4 mr-2" /> Merge…
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => onToggleStatus(member)}>
          {member.isActive ? (
            <><UserX className="h-4 w-4 mr-2 text-warning" />Deactivate</>
          ) : (
            <><UserCheck className="h-4 w-4 mr-2 text-success" />Activate</>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDelete(member)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
