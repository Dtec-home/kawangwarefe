"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Plus, Pencil, Trash2, Save, X, Users } from "lucide-react";
import {
  GET_GROUPS_LIST,
  CREATE_GROUP,
  UPDATE_GROUP,
  DELETE_GROUP,
} from "@/lib/graphql/group-management";

interface GroupItem {
  id: string;
  name: string;
}

interface GetGroupsData {
  groupsList: GroupItem[];
}

export default function GroupsManagementPage() {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery<GetGroupsData>(GET_GROUPS_LIST);
  const groups = useMemo(() => data?.groupsList ?? [], [data]);

  const [createGroup, { loading: creating }] = useMutation(CREATE_GROUP);
  const [updateGroup, { loading: updating }] = useMutation(UPDATE_GROUP);
  const [deleteGroup, { loading: deleting }] = useMutation(DELETE_GROUP);

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const toErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      const { data: response } = await createGroup({
        variables: { name: newName.trim() },
      });
      const result = response?.createGroup;
      if (result?.success) {
        setSuccess(result.message);
        setNewName("");
        await refetch();
      } else {
        setError(result?.message || "Failed to create group");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to create group"));
    }
  };

  const startEdit = (group: GroupItem) => {
    clearMessages();
    setEditingId(group.id);
    setEditName(group.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async (groupId: string) => {
    clearMessages();

    if (!editName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      const { data: response } = await updateGroup({
        variables: { groupId, name: editName.trim() },
      });
      const result = response?.updateGroup;
      if (result?.success) {
        setSuccess(result.message);
        cancelEdit();
        await refetch();
      } else {
        setError(result?.message || "Failed to update group");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to update group"));
    }
  };

  const handleDelete = async (group: GroupItem) => {
    clearMessages();
    if (!window.confirm(`Delete group '${group.name}'?`)) return;

    try {
      const { data: response } = await deleteGroup({
        variables: { groupId: group.id },
      });
      const result = response?.deleteGroup;
      if (result?.success) {
        setSuccess(result.message);
        await refetch();
      } else {
        setError(result?.message || "Failed to delete group");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to delete group"));
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Groups</h1>
            <p className="text-muted-foreground">Manage church groups without Django admin access.</p>
          </div>

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </CardTitle>
              <CardDescription>Add a new member/contribution routing group.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleCreate}>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Youth"
                  />
                </div>
                <Button type="submit" className="sm:self-end" disabled={creating}>
                  {creating ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Existing Groups ({groups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-muted-foreground">Loading groups...</p>}
              {!loading && groups.length === 0 && (
                <p className="text-muted-foreground">No groups yet.</p>
              )}

              {!loading && groups.length > 0 && (
                <div className="space-y-2">
                  {groups.map((group) => {
                    const isEditing = editingId === group.id;

                    return (
                      <div
                        key={group.id}
                        className="border rounded-md p-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
                      >
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="sm:max-w-sm"
                          />
                        ) : (
                          <div className="font-medium">{group.name}</div>
                        )}

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={() => handleUpdate(group.id)} disabled={updating}>
                                <Save className="h-4 w-4 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => startEdit(group)}>
                                <Pencil className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(group)}
                                disabled={deleting}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
