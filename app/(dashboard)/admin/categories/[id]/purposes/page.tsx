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
import { CheckCircle, AlertCircle, Plus, Trash2, ArrowLeft } from "lucide-react";
import { GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import {
  CREATE_DEPARTMENT_PURPOSE,
  DELETE_DEPARTMENT_PURPOSE,
  UPDATE_DEPARTMENT_PURPOSE,
} from "@/lib/graphql/purpose-mutations";

interface Purpose {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

interface PurposesData {
  departmentPurposes: Purpose[];
}

export default function DepartmentPurposesPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params?.id;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    skip: !categoryId,
    variables: { categoryId },
    fetchPolicy: "network-only",
  });

  const purposes = useMemo(() => data?.departmentPurposes ?? [], [data]);

  const [createPurpose, { loading: creating }] = useMutation(CREATE_DEPARTMENT_PURPOSE);
  const [updatePurpose] = useMutation(UPDATE_DEPARTMENT_PURPOSE);
  const [deletePurpose, { loading: deleting }] = useMutation(DELETE_DEPARTMENT_PURPOSE);

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

    if (!categoryId) {
      setError("Invalid department id");
      return;
    }

    if (!name.trim() || !code.trim()) {
      setError("Name and code are required");
      return;
    }

    try {
      const { data: response } = await createPurpose({
        variables: {
          categoryId,
          name: name.trim(),
          code: code.trim().toUpperCase(),
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

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Department Purposes</h1>
              <p className="text-muted-foreground">Manage giving purposes for this department.</p>
            </div>
            <Link href="/admin/categories">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Departments
              </Button>
            </Link>
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
                    <Label htmlFor="purpose-code">Purpose Code</Label>
                    <Input
                      id="purpose-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g., CAMP"
                    />
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
              {loading && <p className="text-muted-foreground">Loading purposes...</p>}

              {!loading && purposes.length === 0 && (
                <p className="text-muted-foreground">No purposes yet for this department.</p>
              )}

              {!loading && purposes.length > 0 && (
                <div className="space-y-2">
                  {purposes.map((purpose) => (
                    <div
                      key={purpose.id}
                      className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium">{purpose.name}</div>
                        <div className="text-sm text-muted-foreground">{purpose.code}</div>
                        {purpose.description && (
                          <div className="text-sm text-muted-foreground mt-1">{purpose.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
