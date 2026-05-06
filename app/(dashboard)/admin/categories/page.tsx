/**
 * Department Management Page
 * Admin CRUD for contribution departments
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  GET_ALL_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
} from "@/lib/graphql/category-mutations";
import { GET_GROUPS_LIST } from "@/lib/graphql/group-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  FolderOpen,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

type Audience = "all" | "adult" | "children";
type RoutingMode = "TOP_LEVEL" | "AUTO_MEMBER_GROUP" | "REQUIRES_PURPOSE" | "OPTIONAL_DETAILS";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  routingMode?: RoutingMode;
  fallbackIfNoGroup?: "TOP_LEVEL" | "REJECT";
  audience?: Audience;
  allowedGroups?: GroupItem[];
}

interface GroupItem {
  id: string;
  name: string;
}

interface GetGroupsData {
  groupsList: GroupItem[];
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

interface CreateCategoryData {
  createCategory: {
    success: boolean;
    message: string;
    category?: Category;
  };
}

interface UpdateCategoryData {
  updateCategory: {
    success: boolean;
    message: string;
    category?: Category;
  };
}

interface DeleteCategoryData {
  deleteCategory: {
    success: boolean;
    message: string;
  };
}

function CategoryManagementPageContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRoutingMode, setNewRoutingMode] = useState<RoutingMode>("TOP_LEVEL");
  const [newFallbackIfNoGroup, setNewFallbackIfNoGroup] = useState<"TOP_LEVEL" | "REJECT">("TOP_LEVEL");
  const [newAllowedGroupIds, setNewAllowedGroupIds] = useState<string[]>([]);
  const [newAudience, setNewAudience] = useState<Audience>("all");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRoutingMode, setEditRoutingMode] = useState<RoutingMode>("TOP_LEVEL");
  const [editFallbackIfNoGroup, setEditFallbackIfNoGroup] = useState<"TOP_LEVEL" | "REJECT">("TOP_LEVEL");
  const [editAllowedGroupIds, setEditAllowedGroupIds] = useState<string[]>([]);
  const [editAudience, setEditAudience] = useState<Audience>("all");

  const { data, loading, refetch } = useQuery<GetCategoriesData>(GET_ALL_CATEGORIES);
  const categories = data?.contributionCategories || [];
  const { data: groupsData } = useQuery<GetGroupsData>(GET_GROUPS_LIST);
  const groups = groupsData?.groupsList || [];

  const [createCategory, { loading: creating }] = useMutation<CreateCategoryData>(CREATE_CATEGORY);
  const [updateCategory, { loading: updating }] = useMutation<UpdateCategoryData>(UPDATE_CATEGORY);
  const [deleteCategory, { loading: deleting }] = useMutation<DeleteCategoryData>(DELETE_CATEGORY);

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  };

  const toggleSelectedGroup = (
    groupId: string,
    selectedGroupIds: string[],
    setSelectedGroupIds: (groupIds: string[]) => void,
  ) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
      return;
    }
    setSelectedGroupIds([...selectedGroupIds, groupId]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newName.trim() || !newCode.trim()) {
      setError("Name and code are required");
      return;
    }

    try {
      const { data } = await createCategory({
        variables: {
          name: newName.trim(),
          code: newCode.trim().toUpperCase(),
          description: newDescription.trim(),
          routingMode: newRoutingMode,
          fallbackIfNoGroup: newRoutingMode === "AUTO_MEMBER_GROUP" ? newFallbackIfNoGroup : undefined,
          allowedGroupIds: newRoutingMode === "AUTO_MEMBER_GROUP" ? newAllowedGroupIds : [],
          audience: newAudience,
        },
      });

      if (data?.createCategory?.success) {
        setSuccess(data.createCategory.message);
        setNewName("");
        setNewCode("");
        setNewDescription("");
        setNewRoutingMode("TOP_LEVEL");
        setNewFallbackIfNoGroup("TOP_LEVEL");
        setNewAllowedGroupIds([]);
        setNewAudience("all");
        setShowCreateForm(false);
        refetch();
      } else {
        setError(data?.createCategory?.message || "Failed to create department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error creating department"));
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditCode(category.code);
    setEditDescription(category.description);
    setEditRoutingMode(category.routingMode ?? "TOP_LEVEL");
    setEditFallbackIfNoGroup(category.fallbackIfNoGroup === "REJECT" ? "REJECT" : "TOP_LEVEL");
    setEditAllowedGroupIds((category.allowedGroups || []).map((group) => group.id));
    setEditAudience((category.audience as Audience) || "all");
    clearMessages();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    clearMessages();
  };

  const handleUpdate = async (categoryId: string) => {
    clearMessages();

    if (!editName.trim() || !editCode.trim()) {
      setError("Name and code are required");
      return;
    }

    try {
      const { data } = await updateCategory({
        variables: {
          categoryId,
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          description: editDescription.trim(),
          routingMode: editRoutingMode,
          fallbackIfNoGroup: editRoutingMode === "AUTO_MEMBER_GROUP" ? editFallbackIfNoGroup : undefined,
          allowedGroupIds: editRoutingMode === "AUTO_MEMBER_GROUP" ? editAllowedGroupIds : [],
          audience: editAudience,
        },
      });

      if (data?.updateCategory?.success) {
        setSuccess(data.updateCategory.message);
        setEditingId(null);
        refetch();
      } else {
        setError(data?.updateCategory?.message || "Failed to update department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error updating department"));
    }
  };

  const handleToggleActive = async (category: Category) => {
    clearMessages();

    try {
      const { data } = await updateCategory({
        variables: {
          categoryId: category.id,
          isActive: !category.isActive,
        },
      });

      if (data?.updateCategory?.success) {
        setSuccess(`Department '${category.name}' ${category.isActive ? "deactivated" : "activated"}`);
        refetch();
      } else {
        setError(data?.updateCategory?.message || "Failed to update department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error updating department"));
    }
  };

  const handleDelete = async (category: Category) => {
    clearMessages();

    const confirmed = await confirm({
      title: 'Delete Department',
      description: `Are you sure you want to delete '${category.name}'? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      const { data } = await deleteCategory({
        variables: { categoryId: category.id },
      });

      if (data?.deleteCategory?.success) {
        setSuccess(data.deleteCategory.message);
        refetch();
      } else {
        setError(data?.deleteCategory?.message || "Failed to delete department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error deleting department"));
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contribution Departments</h1>
            <p className="text-muted-foreground">
              Manage contribution departments (e.g., Tithe, Offering, Building Fund)
            </p>
          </div>
          <Button onClick={() => { setShowCreateForm(!showCreateForm); clearMessages(); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inactiveCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
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

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Department</CardTitle>
              <CardDescription>Add a new contribution department</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Building Fund"
                      value={newName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setNewName(name);
                        // Auto-generate code from name
                        const autoCode = name
                          .trim()
                          .split(/\s+/)
                          .map((w) => w.slice(0, 5))
                          .join("_")
                          .toUpperCase()
                          .replace(/[^A-Z0-9_]/g, "")
                          .slice(0, 20);
                        setNewCode(autoCode);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., BUILD"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from name. Used as M-Pesa account reference.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="routingMode">Department Type *</Label>
                    <Select value={newRoutingMode} onValueChange={(value: RoutingMode) => {
                      setNewRoutingMode(value);
                      if (value !== "AUTO_MEMBER_GROUP") {
                        setNewAllowedGroupIds([]);
                        setNewFallbackIfNoGroup("TOP_LEVEL");
                      }
                    }}>
                      <SelectTrigger id="routingMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TOP_LEVEL">Top-level Only</SelectItem>
                        <SelectItem value="AUTO_MEMBER_GROUP">Auto-match Member Group</SelectItem>
                        <SelectItem value="REQUIRES_PURPOSE">Requires Purpose</SelectItem>
                        <SelectItem value="OPTIONAL_DETAILS">Optional Details</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Select value={newAudience} onValueChange={(v: Audience) => setNewAudience(v)}>
                      <SelectTrigger id="audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All members</SelectItem>
                        <SelectItem value="adult">Adults only</SelectItem>
                        <SelectItem value="children">Children only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newRoutingMode === "AUTO_MEMBER_GROUP" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="fallbackIfNoGroup">If member has no group</Label>
                        <Select value={newFallbackIfNoGroup} onValueChange={(value: "TOP_LEVEL" | "REJECT") => setNewFallbackIfNoGroup(value)}>
                          <SelectTrigger id="fallbackIfNoGroup">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOP_LEVEL">Fallback to Top-level</SelectItem>
                            <SelectItem value="REJECT">Reject Contribution</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Allowed Groups for Auto Route</Label>
                        <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
                          {groups.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No groups available.</p>
                          ) : (
                            groups.map((group) => (
                              <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={newAllowedGroupIds.includes(group.id)}
                                  onCheckedChange={() =>
                                    toggleSelectedGroup(group.id, newAllowedGroupIds, setNewAllowedGroupIds)
                                  }
                                />
                                {group.name}
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Department"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Departments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              All Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading departments...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No departments found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {editingId === category.id ? (
                      /* Edit Mode */
                      <div className="flex-1 space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Code</Label>
                            <Input
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                              maxLength={20}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Department Type</Label>
                            <Select value={editRoutingMode} onValueChange={(value: RoutingMode) => {
                              setEditRoutingMode(value);
                              if (value !== "AUTO_MEMBER_GROUP") {
                                setEditAllowedGroupIds([]);
                                setEditFallbackIfNoGroup("TOP_LEVEL");
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TOP_LEVEL">Top-level Only</SelectItem>
                                <SelectItem value="AUTO_MEMBER_GROUP">Auto-match Member Group</SelectItem>
                                <SelectItem value="REQUIRES_PURPOSE">Requires Purpose</SelectItem>
                                <SelectItem value="OPTIONAL_DETAILS">Optional Details</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Audience</Label>
                            <Select value={editAudience} onValueChange={(v: Audience) => setEditAudience(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All members</SelectItem>
                                <SelectItem value="adult">Adults only</SelectItem>
                                <SelectItem value="children">Children only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {editRoutingMode === "AUTO_MEMBER_GROUP" && (
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">If member has no group</Label>
                                <Select value={editFallbackIfNoGroup} onValueChange={(value: "TOP_LEVEL" | "REJECT") => setEditFallbackIfNoGroup(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TOP_LEVEL">Fallback to Top-level</SelectItem>
                                    <SelectItem value="REJECT">Reject Contribution</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Allowed Groups for Auto Route</Label>
                                <div className="max-h-36 overflow-y-auto rounded-md border p-3 space-y-2">
                                  {groups.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No groups available.</p>
                                  ) : (
                                    groups.map((group) => (
                                      <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                          checked={editAllowedGroupIds.includes(group.id)}
                                          onCheckedChange={() =>
                                            toggleSelectedGroup(group.id, editAllowedGroupIds, setEditAllowedGroupIds)
                                          }
                                        />
                                        {group.name}
                                      </label>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(category.id)}
                            disabled={updating}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {updating ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {category.code}
                            </Badge>
                            {category.isActive ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                            {category.routingMode === "TOP_LEVEL" && (
                              <Badge variant="outline" className="text-xs">Top-level</Badge>
                            )}
                            {category.routingMode === "REQUIRES_PURPOSE" && (
                              <Badge variant="outline" className="text-xs">Requires Purpose</Badge>
                            )}
                            {category.routingMode === "AUTO_MEMBER_GROUP" && (
                              <Badge variant="outline" className="text-xs">Auto Group Match</Badge>
                            )}
                            {category.routingMode === "OPTIONAL_DETAILS" && (
                              <Badge variant="outline" className="text-xs">Optional Details</Badge>
                            )}
                            {category.routingMode === "AUTO_MEMBER_GROUP" && (category.allowedGroups?.length || 0) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {category.allowedGroups?.length} allowed group{(category.allowedGroups?.length || 0) === 1 ? "" : "s"}
                              </Badge>
                            )}
                            {category.audience === "adult" && (
                              <Badge className="bg-slate-100 text-slate-800 text-xs">Adults</Badge>
                            )}
                            {category.audience === "children" && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">Children</Badge>
                            )}
                          </div>
                          {category.routingMode === "REQUIRES_PURPOSE" && (
                            <Link href={`/admin/categories/${category.id}/purposes`}>
                              <Button variant="outline" size="sm">
                                <ListChecks className="h-4 w-4 mr-1" />
                                Purposes
                              </Button>
                            </Link>
                          )}
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(category)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={category.isActive ? "secondary" : "default"}
                            onClick={() => handleToggleActive(category)}
                          >
                            {category.isActive ? (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(category)}
                            disabled={deleting}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog />
    </AdminLayout>
  );
}

export default function CategoryManagementPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <CategoryManagementPageContent />
    </AdminProtectedRoute>
  );
}
