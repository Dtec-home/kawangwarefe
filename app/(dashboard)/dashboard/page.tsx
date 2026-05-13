/**
 * Member Dashboard Page
 * Sprint 2: Authentication & Member Dashboard
 *
 * Shows contribution history, summary cards, and charts
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuery } from "@apollo/client/react";
import { GET_MY_CONTRIBUTIONS } from "@/lib/graphql/queries";
import { GET_DASHBOARD_STATS } from "@/lib/graphql/admin-queries";
import { useMyCategoryAdminRoles } from "@/lib/hooks/use-category-admin";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { useTour } from "@/hooks/use-tour";
import { WELCOME_TOUR_CONFIG } from "@/lib/tours/tour-configs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Calendar, Shield, FolderKey } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Contribution {
  id: string;
  amount: string;
  status: string;
  transactionDate: string | null;
  contributionGroupId: string | null;
  purposeName: string | null;
  routedGroupName: string | null;
  category: {
    id: string;
    name: string;
    code: string;
  };
  mpesaTransaction: {
    id: string;
    mpesaReceiptNumber: string | null;
    status: string;
  } | null;
}

interface ContributionGroup {
  groupId: string;
  contributions: Contribution[];
  totalAmount: number;
  isSplit: boolean;
  isMultiCategory: boolean;
  representative: Contribution;
}

function groupCategoryLabel(group: ContributionGroup): string {
  if (!group.isMultiCategory) return group.representative.category.name;
  const unique = Array.from(
    new Map(group.contributions.map(c => [c.category.id, c.category])).values()
  );
  const names = unique.slice(0, 2).map(c => c.name).join(' + ');
  const suffix = unique.length > 2 ? ` +${unique.length - 2}` : '';
  return names + suffix;
}

interface ContributionsData {
  myContributions: Contribution[];
}

interface DashboardStatsData {
  dashboardStats: {
    todayTotal: string;
  };
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { start: startWelcomeTour, isReady } = useTour({
    tourKey: "welcome_tour",
    steps: WELCOME_TOUR_CONFIG.steps || [],
    autoStart: false,
  });

  const { data, loading, error } = useQuery<ContributionsData>(GET_MY_CONTRIBUTIONS, {
    variables: {
      phoneNumber: user?.phoneNumber,
      limit: 50,
    },
    skip: !user?.phoneNumber,
  });

  // Check if user has admin/staff access by trying to query dashboard stats
  const { data: adminCheck } = useQuery<DashboardStatsData>(GET_DASHBOARD_STATS, {
    errorPolicy: "ignore", // Ignore permission errors
  });

  const isStaff = !!adminCheck?.dashboardStats;

  // Get category admin roles
  const { roles: categoryAdminRoles, isAnyCategoryAdmin } = useMyCategoryAdminRoles();

  // Check if user has content admin role
  const { isContentAdmin } = useUserRole();

  // Calculate contributions early for useEffect dependency
  const contributions = data?.myContributions || [];

  // Auto-start welcome tour for new users (optional - remove if not wanted)
  useEffect(() => {
    if (isReady && contributions.length === 0) {
      // Auto-start for new users with no contributions
      const timer = setTimeout(() => {
        startWelcomeTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, contributions.length, startWelcomeTour]);

  // Group contributions by contributionGroupId
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
    return Array.from(groupMap.entries()).map(([groupId, items]) => {
      const uniqueCategoryIds = new Set(items.map(c => c.category.id));
      return {
        groupId,
        contributions: items,
        totalAmount: items.reduce((sum, c) => sum + Number.parseFloat(c.amount), 0),
        isSplit: items.length > 1,
        isMultiCategory: uniqueCategoryIds.size > 1,
        representative: items[0],
      };
    });
  }, [contributions]);

  // Expand state for split groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Stats calculated on groups to avoid double-counting split sub-contributions
  const completedGroups = contributionGroups.filter((g) => g.representative.status === "completed");
  const totalContributions = completedGroups.reduce((sum, g) => sum + g.totalAmount, 0);

  const thisMonth = new Date();
  const monthlyContributions = completedGroups
    .filter((g) => {
      const date = g.representative.transactionDate ? new Date(g.representative.transactionDate) : null;
      if (!date) return false;
      return (
        date.getMonth() === thisMonth.getMonth() &&
        date.getFullYear() === thisMonth.getFullYear()
      );
    })
    .reduce((sum, g) => sum + g.totalAmount, 0);

  const completedCount = completedGroups.length;

  return (
    <ProtectedRoute>
      <MemberLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {/* Header */}
          <header data-tour="dashboard-header" className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold">My Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome, {user?.fullName}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <Card data-tour="dashboard-snapshot" className="mb-6 border-teal-200/70 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
                  Your Giving Snapshot
                </p>
                <h2 className="text-lg font-semibold">View total contributions and breakdown</h2>
                <p className="text-sm text-muted-foreground">
                  Tap to see your full totals by department, purpose, and group.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" onClick={() => router.push("/profile#contribution-totals")}>
                  View Totals
                </Button>
                <Button variant="outline" onClick={() => router.push("/contribute")}>
                  Give Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div data-tour="dashboard-stats" className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {totalContributions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {completedCount} completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {monthlyContributions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {thisMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                Member since {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Department Admin Roles */}
        {isAnyCategoryAdmin && (
          <Card className="mb-8 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKey className="h-5 w-5 text-blue-600" />
                Your Department Admin Roles
              </CardTitle>
              <CardDescription>
                You have admin privileges for the following contribution departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categoryAdminRoles.map((role) => (
                  <div
                    key={role.id}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <Shield className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">{role.category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Since {new Date(role.assignedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                As a department admin, you can view and manage contributions for your assigned departments.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contribution History */}
        <Card>
          <CardHeader>
            <CardTitle>Contribution History</CardTitle>
            <CardDescription>
              View all your past contributions and their status
            </CardDescription>
          </CardHeader>
          <CardContent data-tour="dashboard-history">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading contributions...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-600">
                Error loading contributions: {error.message}
              </div>
            )}

            {!loading && !error && contributions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No contributions yet</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/contribute")}
                >
                  Make Your First Contribution
                </Button>
              </div>
            )}

            {!loading && !error && contributions.length > 0 && (
              <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {contributionGroups.map((group) => {
                  const rep = group.representative;
                  const isExpanded = expandedGroups.has(group.groupId);
                  const statusClass =
                    rep.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : rep.status === "failed"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
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
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusClass}`}>
                              {rep.status}
                            </span>
                            {group.isSplit && (
                              isExpanded
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            {groupCategoryLabel(group)}
                            {group.isSplit && (
                              <span className="ml-1 text-xs text-teal-600 dark:text-teal-400">
                                ({group.contributions.length} purposes)
                              </span>
                            )}
                          </span>
                          <span>
                            {rep.transactionDate
                              ? new Date(rep.transactionDate).toLocaleDateString()
                              : "Pending"}
                          </span>
                        </div>
                        {rep.mpesaTransaction?.mpesaReceiptNumber && (
                          <div className="text-xs font-mono text-muted-foreground">
                            Receipt: {rep.mpesaTransaction.mpesaReceiptNumber}
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
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Department</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-center p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributionGroups.map((group) => {
                      const rep = group.representative;
                      const isExpanded = expandedGroups.has(group.groupId);
                      const statusClass =
                        rep.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : rep.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
                      return (
                        <React.Fragment key={group.groupId}>
                          <tr
                            className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800 ${group.isSplit ? "cursor-pointer" : ""}`}
                            onClick={() => group.isSplit && toggleGroup(group.groupId)}
                          >
                            <td className="p-2 text-sm">
                              {rep.transactionDate
                                ? new Date(rep.transactionDate).toLocaleDateString()
                                : "Pending"}
                            </td>
                            <td className="p-2 text-sm">
                              <span>{groupCategoryLabel(group)}</span>
                              {group.isSplit && (
                                <span className="ml-1 text-xs text-teal-600 dark:text-teal-400">
                                  ({group.contributions.length} purposes)
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-sm text-right font-semibold">
                              KES {group.totalAmount.toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusClass}`}>
                                {rep.status}
                              </span>
                            </td>
                            <td className="p-2 text-sm font-mono">
                              <div className="flex items-center gap-1">
                                {rep.mpesaTransaction?.mpesaReceiptNumber || "-"}
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
                              <td className="p-2 text-sm text-muted-foreground pl-6" />
                              <td className="p-2 text-sm text-muted-foreground pl-6">
                                ↳ {c.purposeName || c.category.name}
                              </td>
                              <td className="p-2 text-sm text-right text-muted-foreground">
                                KES {Number.parseFloat(c.amount).toLocaleString()}
                              </td>
                              <td />
                              <td />
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
          </main>
        </div>
      </MemberLayout>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
