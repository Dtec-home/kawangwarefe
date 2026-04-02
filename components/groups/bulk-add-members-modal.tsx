"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Users, AlertCircle, Loader2 } from "lucide-react";
import { GET_MEMBERS_LIST } from "@/lib/graphql/admin-queries";
import { BULK_ADD_MEMBERS_TO_GROUP } from "@/lib/graphql/group-management";

interface MemberItem {
  id: string;
  fullName: string;
  phoneNumber: string;
}

interface GetMembersData {
  membersList: {
    items: MemberItem[];
    total: number;
    hasMore: boolean;
  };
}

interface BulkAddResponse {
  bulkAddMembersToGroup: {
    success: boolean;
    message: string;
  };
}

interface BulkAddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export function BulkAddMembersModal({ open, onOpenChange, groupId, groupName }: BulkAddMembersModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data, loading } = useQuery<GetMembersData>(GET_MEMBERS_LIST, {
    variables: { search: searchTerm, limit: 50, offset: 0 },
    skip: !open,
  });

  const members = useMemo(() => data?.membersList.items || [], [data]);

  const [bulkAdd, { loading: adding }] = useMutation<BulkAddResponse>(BULK_ADD_MEMBERS_TO_GROUP);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === members.length && members.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      setError("Please select at least one member.");
      return;
    }
    setError("");
    setSuccess("");

    try {
      const { data: result } = await bulkAdd({
        variables: {
          memberIds: Array.from(selectedIds),
          groupId
        }
      });
      if (result?.bulkAddMembersToGroup?.success) {
        setSuccess(result.bulkAddMembersToGroup.message);
        setSelectedIds(new Set());
        // Optionally auto-close after a delay
        setTimeout(() => {
          onOpenChange(false);
          setSuccess("");
        }, 2000);
      } else {
        setError(result?.bulkAddMembersToGroup?.message || "Failed to add members.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  // Reset state when closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchTerm("");
      setSelectedIds(new Set());
      setError("");
      setSuccess("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Members to {groupName}</DialogTitle>
          <DialogDescription>
            Select members to bulk add to this group.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="py-2 bg-green-50 text-green-800 border-green-200">
            <Users className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search members..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border rounded-md p-2 space-y-2 mt-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex justify-center flex-col items-center h-full text-muted-foreground text-sm">
              No members found.
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 pb-2 mb-2 border-b px-2 sticky top-0 bg-card z-10">
                <Checkbox 
                  id="select-all" 
                  checked={members.length > 0 && selectedIds.size === members.length}
                  onCheckedChange={selectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                  Select All
                </Label>
              </div>
              {members.map(member => (
                <div key={member.id} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted rounded">
                  <Checkbox 
                    id={`member-${member.id}`} 
                    checked={selectedIds.has(member.id)}
                    onCheckedChange={() => toggleSelection(member.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`member-${member.id}`} className="cursor-pointer text-sm font-medium">
                      {member.fullName}
                    </Label>
                    <div className="text-xs text-muted-foreground">{member.phoneNumber}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={adding}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={selectedIds.size === 0 || adding}>
            {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
