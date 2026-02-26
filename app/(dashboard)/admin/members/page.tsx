/**
 * Admin Members Page
 * Sprint 3: Admin Dashboard
 *
 * View and manage all members with edit, activate/deactivate, and delete
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MEMBERS_LIST } from "@/lib/graphql/admin-queries";
import { UPDATE_MEMBER, TOGGLE_MEMBER_STATUS, DELETE_MEMBER } from "@/lib/graphql/member-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Upload,
  Pencil,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  memberNumber: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

interface MembersData {
  membersList: Member[];
}

function MembersPageContent() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Get members with filters
  const { data, loading, error: queryError, refetch } = useQuery<MembersData>(GET_MEMBERS_LIST, {
    variables: {
      search: searchTerm || null,
      isActive: statusFilter === "all" ? null : statusFilter === "active",
      limit: 100,
      offset: 0,
    },
  });

  const [updateMember, { loading: updating }] = useMutation(UPDATE_MEMBER);
  const [toggleStatus] = useMutation(TOGGLE_MEMBER_STATUS);
  const [deleteMember] = useMutation(DELETE_MEMBER);

  const members = data?.membersList || [];

  // Calculate stats
  const activeMembers = members.filter((m) => m.isActive).length;
  const inactiveMembers = members.filter((m) => !m.isActive).length;

  const clearMessages = () => { setSuccess(""); setError(""); };

  const handleStartEdit = (member: Member) => {
    setEditingId(member.id);
    setEditData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      phoneNumber: member.phoneNumber,
    });
    clearMessages();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    clearMessages();
  };

  const handleSaveEdit = async (memberId: string) => {
    clearMessages();
    try {
      const { data } = await updateMember({
        variables: {
          memberId,
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email || null,
          phoneNumber: editData.phoneNumber,
        },
      });
      if (data?.updateMember?.success) {
        setSuccess(data.updateMember.message);
        setEditingId(null);
        refetch();
      } else {
        setError(data?.updateMember?.message || "Failed to update member");
      }
    } catch (err: any) {
      setError(err.message || "Error updating member");
    }
  };

  const handleToggleStatus = async (member: Member) => {
    clearMessages();
    const action = member.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${member.fullName}?`)) return;

    try {
      const { data } = await toggleStatus({ variables: { memberId: member.id } });
      if (data?.toggleMemberStatus?.success) {
        setSuccess(data.toggleMemberStatus.message);
        refetch();
      } else {
        setError(data?.toggleMemberStatus?.message || "Failed to toggle status");
      }
    } catch (err: any) {
      setError(err.message || "Error toggling status");
    }
  };

  const handleDelete = async (member: Member) => {
    clearMessages();
    if (!confirm(`Are you sure you want to delete ${member.fullName}? This cannot be undone.`)) return;

    try {
      const { data } = await deleteMember({ variables: { memberId: member.id } });
      if (data?.deleteMember?.success) {
        setSuccess(data.deleteMember.message);
        refetch();
      } else {
        setError(data?.deleteMember?.message || "Failed to delete member");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting member");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">View and manage church members</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">All registered members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Members</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveMembers}</div>
              <p className="text-xs text-muted-foreground">Currently inactive</p>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name, phone number, member number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
              >
                Clear Filters
              </Button>
              <Link href="/admin/members/import">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Members
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8 text-muted-foreground">Loading members...</div>
            )}
            {queryError && (
              <div className="text-center py-8 text-red-600">
                Error loading members: {queryError.message}
              </div>
            )}
            {!loading && !queryError && members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No members found</div>
            )}
            {!loading && !queryError && members.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Member #</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Phone Number</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Joined</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {editingId === member.id ? (
                          /* Edit Mode Row */
                          <>
                            <td className="p-3 text-sm font-mono">{member.memberNumber || '-'}</td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Input
                                  className="h-8 text-sm"
                                  value={editData.firstName}
                                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                                  placeholder="First name"
                                />
                                <Input
                                  className="h-8 text-sm"
                                  value={editData.lastName}
                                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                                  placeholder="Last name"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <Input
                                className="h-8 text-sm font-mono"
                                value={editData.phoneNumber}
                                onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                className="h-8 text-sm"
                                value={editData.email}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                placeholder="email@example.com"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${member.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                              }`}>
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {new Date(member.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center gap-1">
                                <Button size="sm" variant="default" onClick={() => handleSaveEdit(member.id)} disabled={updating}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          /* Display Mode Row */
                          <>
                            <td className="p-3 text-sm font-mono">{member.memberNumber || '-'}</td>
                            <td className="p-3 text-sm">
                              <div className="font-medium">{member.fullName}</div>
                            </td>
                            <td className="p-3 text-sm font-mono">{member.phoneNumber}</td>
                            <td className="p-3 text-sm">{member.email || '-'}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${member.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                              }`}>
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {new Date(member.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleStartEdit(member)} title="Edit">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleStatus(member)}
                                  title={member.isActive ? "Deactivate" : "Activate"}
                                >
                                  {member.isActive ? (
                                    <UserX className="h-3 w-3 text-yellow-600" />
                                  ) : (
                                    <UserCheck className="h-3 w-3 text-green-600" />
                                  )}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(member)} title="Delete">
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function MembersPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <MembersPageContent />
    </AdminProtectedRoute>
  );
}
