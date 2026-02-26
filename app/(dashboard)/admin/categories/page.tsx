/**
 * Category Management Page
 * Admin CRUD for contribution categories
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  GET_ALL_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
} from "@/lib/graphql/category-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

function CategoryManagementPageContent() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data, loading, refetch } = useQuery<GetCategoriesData>(GET_ALL_CATEGORIES);
  const categories = data?.contributionCategories || [];

  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY);
  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory, { loading: deleting }] = useMutation(DELETE_CATEGORY);

  const clearMessages = () => {
    setSuccess("");
    setError("");
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
        },
      });

      if (data?.createCategory?.success) {
        setSuccess(data.createCategory.message);
        setNewName("");
        setNewCode("");
        setNewDescription("");
        setShowCreateForm(false);
        refetch();
      } else {
        setError(data?.createCategory?.message || "Failed to create category");
      }
    } catch (err: any) {
      setError(err.message || "Error creating category");
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditCode(category.code);
    setEditDescription(category.description);
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
        },
      });

      if (data?.updateCategory?.success) {
        setSuccess(data.updateCategory.message);
        setEditingId(null);
        refetch();
      } else {
        setError(data?.updateCategory?.message || "Failed to update category");
      }
    } catch (err: any) {
      setError(err.message || "Error updating category");
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
        setSuccess(`Category '${category.name}' ${category.isActive ? "deactivated" : "activated"}`);
        refetch();
      } else {
        setError(data?.updateCategory?.message || "Failed to update category");
      }
    } catch (err: any) {
      setError(err.message || "Error updating category");
    }
  };

  const handleDelete = async (category: Category) => {
    clearMessages();

    if (!confirm(`Are you sure you want to delete '${category.name}'? This cannot be undone.`)) {
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
        setError(data?.deleteCategory?.message || "Failed to delete category");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting category");
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
            <h1 className="text-3xl font-bold">Contribution Categories</h1>
            <p className="text-muted-foreground">
              Manage contribution categories (e.g., Tithe, Offering, Building Fund)
            </p>
          </div>
          <Button onClick={() => { setShowCreateForm(!showCreateForm); clearMessages(); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
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
              <CardTitle>Create New Category</CardTitle>
              <CardDescription>Add a new contribution category</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
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
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              All Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No categories found. Create one to get started.
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
                          </div>
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
