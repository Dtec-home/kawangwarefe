/**
 * Family tab (Sprint 3 / Epic E2).
 *
 * Authenticated adult members can list their dependents and add new ones.
 * The backend `FamilyLinkService` is the source of truth for validation;
 * this page submits minimal input and surfaces server messages verbatim.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ADD_CHILD, GET_MY_DEPENDENTS } from "@/lib/graphql/family-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { StatusBadge } from "@/components/ui/status-badge";

interface Dependent {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isMinor: boolean;
  dateOfBirth: string | null;
  memberNumber: string;
}

interface DependentsData {
  myDependents: Dependent[];
}

interface AddChildData {
  addChild: {
    success: boolean;
    message: string;
    member: Dependent | null;
  };
}

function FamilyContent() {
  const { data, loading, refetch } = useQuery<DependentsData>(
    GET_MY_DEPENDENTS,
    { fetchPolicy: "cache-and-network" }
  );
  const [addChild, { loading: submitting }] =
    useMutation<AddChildData>(ADD_CHILD);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    try {
      const { data: resp } = await addChild({
        variables: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob || null,
        },
      });
      const result = resp?.addChild;
      if (result?.success) {
        toast.success(result.message || "Child added");
        setFirstName("");
        setLastName("");
        setDob("");
        await refetch();
      } else {
        setFormError(result?.message || "Could not add child");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const dependents = data?.myDependents ?? [];

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Family</CardTitle>
          <CardDescription>
            Add children under your care. They will not authenticate separately;
            you remain responsible for their church records and giving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data && (
            <div className="space-y-3" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!loading && dependents.length === 0 && (
            <Empty
              icon={Users}
              title="No dependents yet"
              description="You have not added any dependents yet. Use the form below to add a child."
            />
          )}
          {dependents.length > 0 && (
            <ul className="divide-y divide-border" aria-label="Dependents list">
              {dependents.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      #{d.memberNumber}
                      {d.dateOfBirth ? ` · DOB ${d.dateOfBirth}` : ""}
                    </p>
                  </div>
                  {d.isMinor && (
                    <StatusBadge variant="info">Minor</StatusBadge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a child</CardTitle>
          <CardDescription>
            Names must use letters, spaces, hyphens or apostrophes (2-50 characters).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="child-first-name">First name</Label>
                <Input
                  id="child-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="child-last-name">Last name</Label>
                <Input
                  id="child-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="child-dob">Date of birth (optional)</Label>
              <Input
                id="child-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add child"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FamilyPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <FamilyContent />
      </MemberLayout>
    </ProtectedRoute>
  );
}
