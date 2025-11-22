/**
 * Admin Overview/Dashboard Page
 * Sprint 3: Admin Dashboard
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_STATS, GET_ALL_CONTRIBUTIONS } from "@/lib/graphql/admin-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Calendar, Loader2 } from "lucide-react";

interface DashboardStats {
  todayTotal: string;
  todayCount: number;
  weekTotal: string;
  weekCount: number;
  monthTotal: string;
  monthCount: number;
  totalAmount: string;
  totalCount: number;
  totalMembers: number;
  activeMembers: number;
}

interface Contribution {
  id: string;
  amount: string;
  status: string;
  transactionDate: string;
  member: {
    fullName: string;
    phoneNumber: string;
  };
  category: {
    name: string;
  };
}

function AdminDashboardContent() {
  const { data: statsData, loading: statsLoading } = useQuery<{ dashboardStats: DashboardStats }>(
    GET_DASHBOARD_STATS
  );

  const { data: recentData, loading: recentLoading } = useQuery<{
    allContributions: { items: Contribution[] };
  }>(GET_ALL_CONTRIBUTIONS, {
    variables: {
      pagination: { limit: 10, offset: 0 },
      filters: { status: "completed" },
    },
  });

  const stats = statsData?.dashboardStats;
  const recentContributions = recentData?.allContributions?.items || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          View statistics and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number.parseFloat(stats?.todayTotal || "0").toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayCount || 0} contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number.parseFloat(stats?.weekTotal || "0").toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.weekCount || 0} contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number.parseFloat(stats?.monthTotal || "0").toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.monthCount || 0} contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number.parseFloat(stats?.totalAmount || "0").toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalCount || 0} contributions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
          <CardDescription>Latest completed contributions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading recent contributions...
            </div>
          ) : recentContributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contributions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-sm">Date</th>
                    <th className="text-left p-2 font-medium text-sm">Member</th>
                    <th className="text-left p-2 font-medium text-sm">Category</th>
                    <th className="text-right p-2 font-medium text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContributions.map((contribution) => (
                    <tr key={contribution.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="p-2 text-sm">
                        {new Date(contribution.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-sm">
                        <div>{contribution.member.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {contribution.member.phoneNumber}
                        </div>
                      </td>
                      <td className="p-2 text-sm">{contribution.category.name}</td>
                      <td className="p-2 text-sm text-right font-semibold">
                        KES {Number.parseFloat(contribution.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Total registered members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.activeMembers || 0} active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Contributions:</span>
              <span className="font-semibold">{stats?.totalCount || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average/Member:</span>
              <span className="font-semibold">
                KES{" "}
                {stats?.totalMembers && stats?.totalCount
                  ? (Number.parseFloat(stats.totalAmount) / stats.totalMembers).toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <AdminDashboardContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
