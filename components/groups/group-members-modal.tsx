"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GET_GROUP_MEMBERS } from "@/lib/graphql/group-members";
import { REMOVE_MEMBER_FROM_GROUP } from "@/lib/graphql/group-management";

interface GroupMember {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

interface GroupMembersData {
  group: {
    id: string;
    name: string;
    members: GroupMember[];
  };
}

interface RemoveMemberFromGroupData {
  removeMemberFromGroup: {
    success: boolean;
    message: string;
  };
}

interface GroupMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export function GroupMembersModal({ open, onOpenChange, groupId, groupName }: Readonly<GroupMembersModalProps>) {
  const [actionMessage, setActionMessage] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<GroupMembersData>(GET_GROUP_MEMBERS, {
    variables: { groupId },
    skip: !open,
  });

  const [removeMemberFromGroup] = useMutation<RemoveMemberFromGroupData>(REMOVE_MEMBER_FROM_GROUP);

  const members = data?.group?.members || [];

  const handleRemoveMember = async (member: GroupMember) => {
    setActionMessage("");
    setActionError("");

    const confirmed = globalThis.confirm(`Remove ${member.fullName} from ${groupName}?`);
    if (!confirmed) return;

    setRemovingMemberId(member.id);
    try {
      const { data: response } = await removeMemberFromGroup({
        variables: {
          memberId: member.id,
          groupId,
        },
      });

      if (response?.removeMemberFromGroup?.success) {
        setActionMessage(response.removeMemberFromGroup.message);
        await refetch();
      } else {
        setActionError(response?.removeMemberFromGroup?.message || "Failed to remove member.");
      }
    } catch {
      setActionError("Failed to remove member.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Members in {groupName}</DialogTitle>
        </DialogHeader>
        {loading && <div className="text-muted-foreground">Loading members...</div>}
        {error && <div className="text-destructive">Failed to load members.</div>}
        {!loading && !error && actionMessage && <div className="text-sm text-success">{actionMessage}</div>}
        {!loading && !error && actionError && <div className="text-sm text-destructive">{actionError}</div>}
        {!loading && !error && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.length === 0 ? (
              <div className="text-muted-foreground">No members in this group.</div>
            ) : (
              <ul className="divide-y">
                {members.map((member: GroupMember) => (
                  <li key={member.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{member.fullName}</div>
                      <div className="text-xs text-muted-foreground">{member.phoneNumber} {member.email && `| ${member.email}`}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removingMemberId === member.id}
                      className="mt-2 sm:mt-0"
                    >
                      {removingMemberId === member.id ? "Removing..." : "Remove"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
