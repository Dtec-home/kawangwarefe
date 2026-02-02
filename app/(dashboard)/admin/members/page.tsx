/**
 * Admin Members Page
 * Sprint 3: Admin Dashboard
 *
 * View and manage all members
 */

"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_MEMBERS_LIST } from "@/lib/graphql/admin-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Search, Users, UserCheck, UserX, Upload } from "lucide-react";
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

  // Get members with filters
  const { data, loading, error } = useQuery<MembersData>(GET_MEMBERS_LIST, {
    variables: {
      search: searchTerm || null,
      isActive: statusFilter === "all" ? null : statusFilter === "active",
      limit: 100,
      offset: 0,
    },
  });

  const members = data?.membersList || [];

  // Calculate stats
  const activeMembers = members.filter((m) => m.isActive).length;
  const inactiveMembers = members.filter((m) => !m.isActive).length;

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
              <p className="text-xs text-muted-foreground">
                All registered members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Members</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveMembers}</div>
              <p className="text-xs text-muted-foreground">
                Currently inactive
              </p>
            </CardContent>
          </Card>
        </div>

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
              {/* Search */}
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

              {/* Status Filter */}
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
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
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
              <div className="text-center py-8 text-muted-foreground">
                Loading members...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-600">
                Error loading members: {error.message}
              </div>
            )}

            {!loading && !error && members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found
              </div>
            )}

            {!loading && !error && members.length > 0 && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <td className="p-3 text-sm font-mono">
                          {member.memberNumber || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="font-medium">{member.fullName}</div>
                        </td>
                        <td className="p-3 text-sm font-mono">
                          {member.phoneNumber}
                        </td>
                        <td className="p-3 text-sm">
                          {member.email || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${member.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                              }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(member.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
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
