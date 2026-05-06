/**
 * Admin Contributions Page
 * Sprint 3: Admin Dashboard
 *
 * View and manage all contributions
 */

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_CONTRIBUTIONS, GET_CONTRIBUTION_STATS, GET_GROUP_CONTRIBUTIONS, GET_MY_GROUP_NAMES } from "@/lib/graphql/admin-queries";
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Search, Filter, DollarSign, CheckCircle, XCircle, Clock, Plus, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Contribution {
  id: string;
  amount: string;
  status: string;
  transactionDate: string | null;
  notes: string | null;
  contributionGroupId?: string | null;
  routedGroupName?: string | null;
  purposeName?: string | null;
  member: {
    id: string;
    fullName: string;
    phoneNumber: string;
    memberNumber: string | null;
  };
  category: {
    id: string;
    name: string;
    code: string;
  };
  mpesaTransaction: {
    id: string;
    mpesaReceiptNumber: string | null;
    status: string;
    resultDesc: string | null;
  } | null;
}

interface ContributionsData {
  allContributions: {
    items: Contribution[];
    total: number;
    hasMore: boolean;
  };
}

interface GroupNamesData {
  myGroupNames: string[];
}

interface GroupContributionsData {
  groupContributions: {
    items: Contribution[];
    total: number;
    hasMore: boolean;
  };
}

interface StatsData {
  contributionStats: {
    totalAmount: string;
    totalCount: number;
    completedAmount: string;
    completedCount: number;
    pendingAmount: string;
    pendingCount: number;
    failedCount: number;
  };
}

interface Category {
  id: string;
  name: string;
  code: string;
}

interface CategoriesData {
  contributionCategories: Category[];
}

interface Purpose {
  id: string;
  name: string;
  code: string;
}

interface PurposesData {
  departmentPurposes: Purpose[];
}

interface ContributionGroup {
  groupId: string;
  contributions: Contribution[];
  totalAmount: number;
  isSplit: boolean;
  representative: Contribution;
}

export default function ContributionsPage() {
  const { isStaff, isCategoryAdmin, isGroupAdmin } = useUserRole();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Get categories
  const { data: categoriesData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const categories = categoriesData?.contributionCategories || [];

  const selectedCategoryId = categoryFilter === "all" ? undefined : categoryFilter;
  const { data: purposesData } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId: selectedCategoryId, isActive: null },
    skip: !selectedCategoryId,
  });
  const purposes = purposesData?.departmentPurposes || [];

  const { data: groupNamesData } = useQuery<GroupNamesData>(GET_MY_GROUP_NAMES, {
    skip: !isGroupAdmin,
  });
  const groupNames = groupNamesData?.myGroupNames || [];

  // Get contributions with filters
  const isGroupScopedView = isGroupAdmin && !isStaff && !isCategoryAdmin;

  const offset = (page - 1) * pageSize;
  const filters = {
    status: statusFilter === "all" ? null : statusFilter,
    categoryId: categoryFilter === "all" ? null : categoryFilter,
    purposeId: purposeFilter === "all" ? null : purposeFilter,
    search: searchTerm || null,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
    dateTo: dateTo ? new Date(dateTo).toISOString() : null,
  };

  // Get stats (group-admins use scoped list, not staff stats)
  const { data: statsData } = useQuery<StatsData>(GET_CONTRIBUTION_STATS, {
    skip: isGroupAdmin && !isStaff && !isCategoryAdmin,
  });
  const stats = statsData?.contributionStats;

  const { data, loading, error } = useQuery<ContributionsData>(GET_ALL_CONTRIBUTIONS, {
    skip: isGroupScopedView,
    variables: {
      filters,
      pagination: {
        limit: pageSize,
        offset,
      },
    },
  });

  // Determine which group to view - use first available group if "all" is selected
  // This ensures we always have a valid group name for group-scoped queries
  let effectiveGroupName: string | undefined;
  if (selectedGroup === "all") {
    effectiveGroupName = groupNames.length > 0 ? groupNames[0] : undefined;
  } else {
    effectiveGroupName = selectedGroup;
  }
  const { data: groupData, loading: groupLoading, error: groupError } = useQuery<GroupContributionsData>(GET_GROUP_CONTRIBUTIONS, {
    skip: !isGroupScopedView || !effectiveGroupName,
    variables: {
      groupName: effectiveGroupName,
      filters,
      pagination: {
        limit: pageSize,
        offset,
      },
    },
  });

  const contributions = isGroupScopedView
    ? (groupData?.groupContributions.items || [])
    : (data?.allContributions.items || []);

  // Group by contributionGroupId so split sub-contributions collapse under a parent row
  const contributionGroups = useMemo<ContributionGroup[]>(() => {
    const groupMap = new Map<string, Contribution[]>();
    for (const c of contributions) {
      const key = c.contributionGroupId || c.id;
      const existing = groupMap.get(key);
      if (existing) {
        existing.push(c);
      } else {
        groupMap.set(key, [c]);
      }
    }
    return Array.from(groupMap.entries()).map(([groupId, items]) => ({
      groupId,
      contributions: items,
      totalAmount: items.reduce((sum, c) => sum + Number.parseFloat(c.amount), 0),
      isSplit: items.length > 1,
      representative: items[0],
    }));
  }, [contributions]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const totalContributions = isGroupScopedView
    ? (groupData?.groupContributions.total || 0)
    : (data?.allContributions.total || 0);
  const hasMore = isGroupScopedView
    ? (groupData?.groupContributions.hasMore || false)
    : (data?.allContributions.hasMore || false);
  const totalPages = Math.max(1, Math.ceil(totalContributions / pageSize));
  const activeLoading = isGroupScopedView ? groupLoading : loading;
  const activeError = isGroupScopedView ? groupError : error;

  const activeFilterCount = [
    statusFilter !== "all",
    categoryFilter !== "all",
    purposeFilter !== "all",
    searchTerm !== "",
    dateFrom !== "",
    dateTo !== "",
  ].filter(Boolean).length;

  const getStatusBadgeClass = (status: string) => {
    if (status === "completed") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    }
    if (status === "failed") {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Contributions</h1>
            <p className="text-muted-foreground">View and manage all church contributions</p>
          </div>
          <Link href="/admin/contributions/manual-entry">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        {stats && !isGroupScopedView && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KES {Number.parseFloat(stats.totalAmount).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCount} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  KES {Number.parseFloat(stats.completedAmount).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedCount} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  KES {Number.parseFloat(stats.pendingAmount).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingCount} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.failedCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Failed transactions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-normal">
                    {activeFilterCount}
                  </span>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-8 px-3 text-sm"
                onClick={() => setShowFilters(f => !f)}
              >
                {showFilters ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${showFilters ? "block" : "hidden"} md:block`}>
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Phone number, name, receipt..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Department</Label>
                <Select value={categoryFilter} onValueChange={(value) => {
                  setCategoryFilter(value);
                  setPurposeFilter("all");
                  setPage(1);
                }}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose Filter */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  value={purposeFilter}
                  onValueChange={(value) => {
                    setPurposeFilter(value);
                    setPage(1);
                  }}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger id="purpose">
                    <SelectValue placeholder={selectedCategoryId ? "All Purposes" : "Select department first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {purposes.map((purpose) => (
                      <SelectItem key={purpose.id} value={purpose.id}>
                        {purpose.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Group Filter (group admins) */}
              {isGroupScopedView && (
                <div className="space-y-2">
                  <Label htmlFor="groupName">My Group</Label>
                  <Select value={selectedGroup} onValueChange={(value) => {
                    setSelectedGroup(value);
                    setPage(1);
                  }}>
                    <SelectTrigger id="groupName">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Default Group</SelectItem>
                      {groupNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From (date & time)</Label>
                <Input
                  id="dateFrom"
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To (date & time)</Label>
                <Input
                  id="dateTo"
                  type="datetime-local"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageSize">Page Size</Label>
                <Select value={String(pageSize)} onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}>
                  <SelectTrigger id="pageSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setPurposeFilter("all");
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
            </div>{/* end collapsible */}
          </CardContent>
        </Card>

        {/* Contributions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contributions</CardTitle>
            <CardDescription>
              {totalContributions} contribution{totalContributions === 1 ? '' : 's'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading contributions...
              </div>
            )}

            {activeError && (
              <div className="text-center py-8 text-red-600">
                Error loading contributions: {activeError.message}
              </div>
            )}

            {!activeLoading && !activeError && contributions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No contributions found
              </div>
            )}

            {!activeLoading && !activeError && contributions.length > 0 && (
              <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {contributionGroups.map((group) => {
                  const rep = group.representative;
                  const isExpanded = expandedGroups.has(group.groupId);
                  return (
                    <div key={group.groupId} className="border rounded-lg overflow-hidden">
                      <div
                        className={`p-3 space-y-2 ${group.isSplit ? "cursor-pointer" : ""}`}
                        onClick={() => group.isSplit && toggleGroup(group.groupId)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            KES {group.totalAmount.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(rep.status)}`}>
                              {rep.status}
                            </span>
                            {group.isSplit && (
                              isExpanded
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{rep.member.fullName}</span>
                          {rep.member.memberNumber && (
                            <span className="text-xs text-muted-foreground ml-1">#{rep.member.memberNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            {rep.category.name}
                            {group.isSplit && (
                              <span className="ml-1 text-xs text-teal-600 dark:text-teal-400">
                                ({group.contributions.length} purposes)
                              </span>
                            )}
                          </span>
                          <span>
                            {rep.transactionDate
                              ? new Date(rep.transactionDate).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })
                              : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">{rep.member.phoneNumber}</span>
                          {rep.mpesaTransaction?.mpesaReceiptNumber && (
                            <span className="font-mono">{rep.mpesaTransaction.mpesaReceiptNumber}</span>
                          )}
                        </div>
                        {!group.isSplit && (rep.purposeName || rep.routedGroupName) && (
                          <div className="text-xs text-muted-foreground">
                            {rep.purposeName && <span>Purpose: {rep.purposeName}</span>}
                            {rep.purposeName && rep.routedGroupName && <span> • </span>}
                            {rep.routedGroupName && <span>Group: {rep.routedGroupName}</span>}
                          </div>
                        )}
                      </div>
                      {group.isSplit && isExpanded && (
                        <div className="border-t bg-slate-50 dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-700">
                          {group.contributions.map((c) => (
                            <div key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                              <span className="text-muted-foreground">
                                {c.purposeName || c.category.name}
                              </span>
                              <span className="font-medium">
                                KES {Number.parseFloat(c.amount).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table view */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Member</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Purpose</th>
                      <th className="text-left p-3 font-medium">Group</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributionGroups.map((group) => {
                      const rep = group.representative;
                      const isExpanded = expandedGroups.has(group.groupId);
                      return (
                        <>
                          <tr
                            key={group.groupId}
                            className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800 ${group.isSplit ? "cursor-pointer" : ""}`}
                            onClick={() => group.isSplit && toggleGroup(group.groupId)}
                          >
                            <td className="p-3 text-sm">
                              {rep.transactionDate
                                ? new Date(rep.transactionDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : 'Pending'}
                            </td>
                            <td className="p-3 text-sm">
                              <div>
                                <div className="font-medium">{rep.member.fullName}</div>
                                {rep.member.memberNumber && (
                                  <div className="text-xs text-muted-foreground">
                                    #{rep.member.memberNumber}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm font-mono">
                              {rep.member.phoneNumber}
                            </td>
                            <td className="p-3 text-sm">
                              <div>
                                <div>
                                  {rep.category.name}
                                  {group.isSplit && (
                                    <span className="ml-1 text-xs text-teal-600 dark:text-teal-400">
                                      ({group.contributions.length})
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {rep.category.code}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {group.isSplit ? (
                                <span className="text-teal-600 dark:text-teal-400 text-xs">Auto-split</span>
                              ) : (
                                rep.purposeName || "Top-level"
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {rep.routedGroupName || "Top-level"}
                            </td>
                            <td className="p-3 text-sm text-right font-semibold">
                              KES {group.totalAmount.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(rep.status)}`}>
                                {rep.status}
                              </span>
                            </td>
                            <td className="p-3 text-sm font-mono">
                              <div className="flex items-center gap-1">
                                {rep.mpesaTransaction?.mpesaReceiptNumber || '-'}
                                {group.isSplit && (
                                  isExpanded
                                    ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </td>
                          </tr>
                          {group.isSplit && isExpanded && group.contributions.map((c) => (
                            <tr key={c.id} className="border-b bg-slate-50 dark:bg-slate-800/50">
                              <td />
                              <td />
                              <td />
                              <td className="p-3 text-sm text-muted-foreground pl-6">
                                ↳ {c.purposeName || c.category.name}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {c.purposeName || "—"}
                              </td>
                              <td />
                              <td className="p-3 text-sm text-right text-muted-foreground">
                                KES {Number.parseFloat(c.amount).toLocaleString()}
                              </td>
                              <td />
                              <td />
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
