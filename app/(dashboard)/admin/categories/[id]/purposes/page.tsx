"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { CheckCircle, AlertCircle, Plus, Trash2, ArrowLeft, Pencil, ListChecks } from "lucide-react";
import { GET_DEPARTMENT_PURPOSES, GET_CATEGORY_ALLOCATIONS } from "@/lib/graphql/queries";
import {
  CREATE_DEPARTMENT_PURPOSE,
  DELETE_DEPARTMENT_PURPOSE,
  UPDATE_DEPARTMENT_PURPOSE,
} from "@/lib/graphql/purpose-mutations";
import {
  CREATE_PURPOSE_ALLOCATION,
  UPDATE_PURPOSE_ALLOCATION,
  DELETE_PURPOSE_ALLOCATION,
} from "@/lib/graphql/allocation-mutations";

interface Purpose {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

interface Allocation {
  id: string;
  percentage: string;
  isActive: boolean;
  purpose: { id: string; name: string; code: string };
}

interface PurposesData {
  departmentPurposes: Purpose[];
}

interface AllocationsData {
  categoryAllocations: Allocation[];
}

interface AllocationResponse {
  success: boolean;
  message: string;
  allocation?: Allocation | null;
}

interface CreateAllocData { createPurposeAllocation: AllocationResponse }
interface UpdateAllocData { updatePurposeAllocation: AllocationResponse }
interface DeleteAllocData { deletePurposeAllocation: { success: boolean; message: string } }

interface DepartmentPurposeResponse {
  success: boolean;
  message: string;
  purpose?: Purpose | null;
}

interface CreatePurposeData {
  createDepartmentPurpose: DepartmentPurposeResponse;
}

interface UpdatePurposeData {
  updateDepartmentPurpose: DepartmentPurposeResponse;
}

interface DeletePurposeData {
  deleteDepartmentPurpose: Omit<DepartmentPurposeResponse, 'purpose'>;
}

function toGeneratedCodePreview(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export default function DepartmentPurposesPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params?.id;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editingPurposeId, setEditingPurposeId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [autoGenerateEditCode, setAutoGenerateEditCode] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Allocation state
  const [newAllocPurposeId, setNewAllocPurposeId] = useState("");
  const [newAllocPct, setNewAllocPct] = useState("");
  const [editAllocId, setEditAllocId] = useState<string | null>(null);
  const [editAllocPct, setEditAllocPct] = useState("");
  const [allocSuccess, setAllocSuccess] = useState("");
  const [allocError, setAllocError] = useState("");

  const { data, loading, refetch } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    skip: !categoryId,
    variables: { categoryId, isActive: null },
    fetchPolicy: "network-only",
  });

  const { data: allocData, refetch: refetchAllocs } = useQuery<AllocationsData>(GET_CATEGORY_ALLOCATIONS, {
    skip: !categoryId,
    variables: { categoryId },
    fetchPolicy: "network-only",
  });

  const purposes = useMemo(() => data?.departmentPurposes ?? [], [data]);
  const allocations = useMemo(() => allocData?.categoryAllocations ?? [], [allocData]);

  // All allocated purpose IDs (active or inactive) — used to prevent duplicate allocation rows
  const allocatedPurposeIds = useMemo(
    () => new Set(allocations.map((a) => a.purpose.id)),
    [allocations]
  );

  const availablePurposes = useMemo(
    () => purposes.filter((p) => p.isActive && !allocatedPurposeIds.has(p.id)),
    [purposes, allocatedPurposeIds]
  );

  const allocTotal = useMemo(
    () => allocations.filter((a) => a.isActive).reduce((sum, a) => sum + parseFloat(a.percentage), 0),
    [allocations]
  );

  const [createPurpose, { loading: creating }] = useMutation<CreatePurposeData>(CREATE_DEPARTMENT_PURPOSE);
  const [updatePurpose] = useMutation<UpdatePurposeData>(UPDATE_DEPARTMENT_PURPOSE);
  const [deletePurpose, { loading: deleting }] = useMutation<DeletePurposeData>(DELETE_DEPARTMENT_PURPOSE);

  const [createAlloc, { loading: creatingAlloc }] = useMutation<CreateAllocData>(CREATE_PURPOSE_ALLOCATION);
  const [updateAlloc] = useMutation<UpdateAllocData>(UPDATE_PURPOSE_ALLOCATION);
  const [deleteAlloc] = useMutation<DeleteAllocData>(DELETE_PURPOSE_ALLOCATION);

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const clearAllocMessages = () => {
    setAllocSuccess("");
    setAllocError("");
  };

  const handleCreateAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllocMessages();
    if (!categoryId || !newAllocPurposeId || !newAllocPct) {
      setAllocError("Select a purpose and enter a percentage");
      return;
    }
    const pct = parseFloat(newAllocPct);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setAllocError("Percentage must be between 0.01 and 100");
      return;
    }
    try {
      const { data: resp } = await createAlloc({
        variables: { categoryId, purposeId: newAllocPurposeId, percentage: pct.toFixed(2) },
      });
      const result = resp?.createPurposeAllocation;
      if (result?.success) {
        setAllocSuccess(result.message);
        setNewAllocPurposeId("");
        setNewAllocPct("");
        await refetchAllocs();
      } else {
        setAllocError(result?.message || "Failed to create allocation");
      }
    } catch (err: unknown) {
      setAllocError(err instanceof Error ? err.message : "Failed to create allocation");
    }
  };

  const handleUpdateAlloc = async (allocId: string) => {
    clearAllocMessages();
    const pct = parseFloat(editAllocPct);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setAllocError("Percentage must be between 0.01 and 100");
      return;
    }
    try {
      const { data: resp } = await updateAlloc({
        variables: { allocationId: allocId, percentage: pct.toFixed(2) },
      });
      const result = resp?.updatePurposeAllocation;
      if (result?.success) {
        setAllocSuccess("Allocation updated");
        setEditAllocId(null);
        await refetchAllocs();
      } else {
        setAllocError(result?.message || "Failed to update allocation");
      }
    } catch (err: unknown) {
      setAllocError(err instanceof Error ? err.message : "Failed to update allocation");
    }
  };

  const handleToggleAllocActive = async (alloc: Allocation) => {
    clearAllocMessages();
    try {
      const { data: resp } = await updateAlloc({
        variables: { allocationId: alloc.id, isActive: !alloc.isActive },
      });
      const result = resp?.updatePurposeAllocation;
      if (result?.success) {
        setAllocSuccess("Allocation updated");
        await refetchAllocs();
      } else {
        setAllocError(result?.message || "Failed to update allocation");
      }
    } catch (err: unknown) {
      setAllocError(err instanceof Error ? err.message : "Failed to update allocation");
    }
  };

  const handleDeleteAlloc = async (alloc: Allocation) => {
    clearAllocMessages();
    if (!window.confirm(`Remove allocation for '${alloc.purpose.name}'?`)) return;
    try {
      const { data: resp } = await deleteAlloc({ variables: { allocationId: alloc.id } });
      const result = resp?.deletePurposeAllocation;
      if (result?.success) {
        setAllocSuccess("Allocation removed");
        await refetchAllocs();
      } else {
        setAllocError(result?.message || "Failed to delete allocation");
      }
    } catch (err: unknown) {
      setAllocError(err instanceof Error ? err.message : "Failed to delete allocation");
    }
  };

  const toErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!categoryId) {
      setError("Invalid department id");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      const { data: response } = await createPurpose({
        variables: {
          categoryId,
          name: name.trim(),
          code: code.trim() ? code.trim().toUpperCase() : undefined,
          description: description.trim(),
        },
      });

      const result = response?.createDepartmentPurpose;
      if (result?.success) {
        setSuccess(result.message);
        setName("");
        setCode("");
        setDescription("");
        await refetch();
      } else {
        setError(result?.message || "Failed to create purpose");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to create purpose"));
    }
  };

  const handleToggleActive = async (purpose: Purpose) => {
    clearMessages();
    try {
      const { data: response } = await updatePurpose({
        variables: { purposeId: purpose.id, isActive: !purpose.isActive },
      });
      const result = response?.updateDepartmentPurpose;
      if (result?.success) {
        setSuccess(result.message);
        await refetch();
      } else {
        setError(result?.message || "Failed to update purpose");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to update purpose"));
    }
  };

  const handleDelete = async (purpose: Purpose) => {
    clearMessages();
    if (!window.confirm(`Delete purpose '${purpose.name}'?`)) return;

    try {
      const { data: response } = await deletePurpose({
        variables: { purposeId: purpose.id },
      });
      const result = response?.deleteDepartmentPurpose;
      if (result?.success) {
        setSuccess(result.message);
        await refetch();
      } else {
        setError(result?.message || "Failed to delete purpose");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to delete purpose"));
    }
  };

  const handleStartEdit = (purpose: Purpose) => {
    clearMessages();
    setEditingPurposeId(purpose.id);
    setEditName(purpose.name);
    setEditCode(purpose.code);
    setEditDescription(purpose.description || "");
    setAutoGenerateEditCode(true);
  };

  const handleCancelEdit = () => {
    setEditingPurposeId(null);
    setEditName("");
    setEditCode("");
    setEditDescription("");
    setAutoGenerateEditCode(true);
  };

  const handleSaveEdit = async (purposeId: string) => {
    clearMessages();

    if (!editName.trim()) {
      setError("Name is required");
      return;
    }

    try {
      const variables: {
        purposeId: string;
        name: string;
        description: string;
        code?: string;
      } = {
        purposeId,
        name: editName.trim(),
        description: editDescription.trim(),
      };

      if (!autoGenerateEditCode) {
        if (!editCode.trim()) {
          setError("Code is required when auto-generation is disabled");
          return;
        }
        variables.code = editCode.trim().toUpperCase();
      }

      const { data: response } = await updatePurpose({ variables });
      const result = response?.updateDepartmentPurpose;

      if (result?.success) {
        setSuccess(result.message);
        handleCancelEdit();
        await refetch();
      } else {
        setError(result?.message || "Failed to update purpose");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to update purpose"));
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Department Purposes"
            description="Manage giving purposes for this department."
            actions={
              <Link href="/admin/categories">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Departments
                </Button>
              </Link>
            }
          />

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
                Add Purpose
              </CardTitle>
              <CardDescription>Create a giving purpose for this department.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purpose-name">Purpose Name</Label>
                    <Input
                      id="purpose-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Camp Meeting"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose-code">Purpose Code (optional)</Label>
                    <Input
                      id="purpose-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Auto-generated if blank"
                    />
                    {!code.trim() && name.trim() && (
                      <p className="text-xs text-muted-foreground">
                        Preview: {toGeneratedCodePreview(name) || "PURPOSE"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose-description">Description</Label>
                  <Textarea
                    id="purpose-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={creating}>
                  {creating ? "Saving..." : "Save Purpose"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Purposes ({purposes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              )}

              {!loading && purposes.length === 0 && (
                <Empty
                  icon={ListChecks}
                  title="No purposes yet"
                  description="No purposes yet for this department."
                />
              )}

              {!loading && purposes.length > 0 && (
                <div className="space-y-2">
                  {purposes.map((purpose) => (
                    <Card
                      key={purpose.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      {editingPurposeId === purpose.id ? (
                        <div className="w-full space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor={`edit-name-${purpose.id}`}>Name</Label>
                              <Input
                                id={`edit-name-${purpose.id}`}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`edit-code-${purpose.id}`}>Code Override</Label>
                              <Input
                                id={`edit-code-${purpose.id}`}
                                value={editCode}
                                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                disabled={autoGenerateEditCode}
                                placeholder="Auto-generated if enabled"
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={autoGenerateEditCode}
                              onChange={(e) => setAutoGenerateEditCode(e.target.checked)}
                            />
                            Auto-generate code from name
                          </label>

                          {autoGenerateEditCode && (
                            <p className="text-xs text-muted-foreground">
                              Preview: {toGeneratedCodePreview(editName) || "PURPOSE"}
                            </p>
                          )}

                          <div className="space-y-1">
                            <Label htmlFor={`edit-desc-${purpose.id}`}>Description</Label>
                            <Textarea
                              id={`edit-desc-${purpose.id}`}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{purpose.name}</div>
                          <div className="text-sm text-muted-foreground">{purpose.code}</div>
                          {!purpose.isActive && (
                            <div className="mt-1">
                              <StatusBadge variant="neutral">Inactive</StatusBadge>
                            </div>
                          )}
                          {purpose.description && (
                            <div className="text-sm text-muted-foreground mt-1">{purpose.description}</div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {editingPurposeId === purpose.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(purpose.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(purpose)}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(purpose)}
                            >
                              {purpose.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(purpose)}
                              disabled={deleting}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Auto-Split Allocation Section */}
          {purposes.length >= 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Auto-Split Allocations</CardTitle>
                <CardDescription>
                  Set percentage splits so every contribution to this department is automatically divided across
                  its purposes — no manual selection required. Auto-split activates when{" "}
                  <strong>at least 2 active allocations sum to exactly 100%</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{allocSuccess}</AlertDescription>
                  </Alert>
                )}
                {allocError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{allocError}</AlertDescription>
                  </Alert>
                )}

                {/* Running total badge + activation status */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    className="px-3 py-1 text-sm"
                    variant={
                      Math.abs(allocTotal - 100) < 0.01
                        ? "success"
                        : allocTotal > 100
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {Math.abs(allocTotal - 100) < 0.01
                      ? `Total: ${allocTotal.toFixed(2)}% ✓`
                      : allocTotal > 100
                      ? `Total: ${allocTotal.toFixed(2)}% — exceeds 100%`
                      : `Total: ${allocTotal.toFixed(2)}% — needs ${(100 - allocTotal).toFixed(2)}% more`}
                  </StatusBadge>
                  {(() => {
                    const activeCount = allocations.filter((a) => a.isActive).length;
                    const isReady = Math.abs(allocTotal - 100) < 0.01 && activeCount >= 2;
                    return (
                      <StatusBadge
                        className="px-3 py-1 text-sm"
                        variant={isReady ? "success" : "neutral"}
                      >
                        {isReady ? "Auto-split: ON" : `Auto-split: OFF${activeCount < 2 ? ` (need ≥2 active, have ${activeCount})` : ""}`}
                      </StatusBadge>
                    );
                  })()}
                </div>

                {/* Existing allocations table */}
                {allocations.length > 0 && (
                  <div className="space-y-2">
                    {allocations.map((alloc) => (
                      <Card
                        key={alloc.id}
                        className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alloc.purpose.name}</span>
                          {!alloc.isActive && (
                            <StatusBadge variant="neutral">inactive</StatusBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editAllocId === alloc.id ? (
                            <>
                              <Input
                                className="w-24"
                                type="number"
                                min="0.01"
                                max="100"
                                step="0.01"
                                value={editAllocPct}
                                onChange={(e) => setEditAllocPct(e.target.value)}
                              />
                              <span className="text-sm">%</span>
                              <Button size="sm" onClick={() => handleUpdateAlloc(alloc.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditAllocId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-mono">{alloc.percentage}%</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditAllocId(alloc.id); setEditAllocPct(alloc.percentage); }}
                              >
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAllocActive(alloc)}
                              >
                                {alloc.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAlloc(alloc)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add new allocation */}
                {availablePurposes.length > 0 && (
                  <form onSubmit={handleCreateAlloc} className="flex flex-wrap items-end gap-3 pt-2 border-t">
                    <div className="space-y-1">
                      <Label>Purpose</Label>
                      <Select value={newAllocPurposeId} onValueChange={setNewAllocPurposeId}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select purpose..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePurposes.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Percentage</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          className="w-24"
                          type="number"
                          min="0.01"
                          max="100"
                          step="0.01"
                          placeholder="50.00"
                          value={newAllocPct}
                          onChange={(e) => setNewAllocPct(e.target.value)}
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                    <Button type="submit" disabled={creatingAlloc || Math.abs(allocTotal - 100) < 0.01}>
                      <Plus className="h-4 w-4 mr-1" />
                      {creatingAlloc ? "Adding..." : "Add Allocation"}
                    </Button>
                  </form>
                )}

                {availablePurposes.length === 0 && allocations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add purposes above before configuring allocations.
                  </p>
                )}
                {availablePurposes.length === 0 && allocations.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    All active purposes have allocations.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
