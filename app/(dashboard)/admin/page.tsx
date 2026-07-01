/**
 * Admin Overview/Dashboard Page
 * Sprint 3: Admin Dashboard
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_STATS, GET_ALL_CONTRIBUTIONS } from "@/lib/graphql/admin-queries";
import { useTour } from "@/hooks/use-tour";
import { ADMIN_DASHBOARD_TOUR_CONFIG } from "@/lib/tours/tour-configs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusToVariant } from "@/components/ui/status-badge";
import { DollarSign, TrendingUp, Users, Calendar, HelpCircle, Wallet, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

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
  previousDayTotal?: string;
  previousWeekTotal?: string;
  previousMonthTotal?: string;
  totalExpenses?: string | null;
  netBalance?: string | null;
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

// Helper function to calculate trend percentage
function calculateTrendPercentage(current: string, previous: string): { percentage: number; direction: "up" | "down" | "neutral" } {
  const curr = Number.parseFloat(current || "0");
  const prev = Number.parseFloat(previous || "0");

  if (prev === 0) {
    return { percentage: 0, direction: "neutral" };
  }

  const change = ((curr - prev) / prev) * 100;

  if (change > 0) {
    return { percentage: change, direction: "up" };
  } else if (change < 0) {
    return { percentage: Math.abs(change), direction: "down" };
  }

  return { percentage: 0, direction: "neutral" };
}

// Decorated labels for contribution statuses; falls back to the raw value.
const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  processing: "Processing",
};

// Status badge for contribution status display — wraps the shared StatusBadge.
function ContributionStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <StatusBadge variant={statusToVariant(status)}>
      {STATUS_LABELS[key] ?? status}
    </StatusBadge>
  );
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

  const { start: startAdminTour, isReady } = useTour({
    tourKey: "admin_dashboard",
    steps: ADMIN_DASHBOARD_TOUR_CONFIG.steps || [],
    autoStart: false,
  });

  const stats = statsData?.dashboardStats;
  const recentContributions = recentData?.allContributions?.items || [];

  // Auto-start admin tour if new admin (optional)
  useEffect(() => {
    if (isReady) {
      // Auto-start disabled - uncomment line below to enable
      // startAdminTour();
    }
  }, [isReady, startAdminTour]);

  if (statsLoading) {
    return (
      // F4.2 — skeleton grid instead of a full-page spinner
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28 border-l-4 border-l-muted">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate trends
  const todayTrend = calculateTrendPercentage(stats?.todayTotal || "0", stats?.previousDayTotal || "0");
  const weekTrend = calculateTrendPercentage(stats?.weekTotal || "0", stats?.previousWeekTotal || "0");
  const monthTrend = calculateTrendPercentage(stats?.monthTotal || "0", stats?.previousMonthTotal || "0");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header — F4.1 h1 for a11y/SEO */}
      <div data-tour="admin-header">
        <PageHeader
          title="Dashboard Overview"
          description="View statistics and recent activity"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => startAdminTour()}
              title="View admin guide"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tour</span>
            </Button>
          }
        />
      </div>

      {/* Stats Grid - Using new StatCard component */}
      <div data-tour="admin-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today"
          value={`KES ${Number.parseFloat(stats?.todayTotal || "0").toLocaleString()}`}
          icon={Calendar}
          color="teal"
          trend={todayTrend}
          subtitle={`${stats?.todayCount || 0} contributions`}
        />

        <StatCard
          title="This Week"
          value={`KES ${Number.parseFloat(stats?.weekTotal || "0").toLocaleString()}`}
          icon={TrendingUp}
          color="emerald"
          trend={weekTrend}
          subtitle={`${stats?.weekCount || 0} contributions`}
        />

        <StatCard
          title="This Month"
          value={`KES ${Number.parseFloat(stats?.monthTotal || "0").toLocaleString()}`}
          icon={DollarSign}
          color="blue"
          trend={monthTrend}
          subtitle={`${stats?.monthCount || 0} contributions`}
        />

        <StatCard
          title="Total"
          value={`KES ${Number.parseFloat(stats?.totalAmount || "0").toLocaleString()}`}
          icon={Users}
          color="purple"
          subtitle={`${stats?.totalCount || 0} contributions`}
        />
      </div>

      {/* Current Balance — only shown when at least one fund opts into expense tracking (W1.5) */}
      {stats?.netBalance != null && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Balance"
            value={`KES ${Number.parseFloat(stats.netBalance).toLocaleString()}`}
            icon={Wallet}
            color="emerald"
            subtitle="Net of recorded expenses"
          />
          <StatCard
            title="Total Out"
            value={`KES ${Number.parseFloat(stats.totalExpenses ?? "0").toLocaleString()}`}
            icon={Receipt}
            color="blue"
            subtitle="Approved & paid expenses"
          />
        </div>
      )}

      {/* Recent Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
          <CardDescription>Latest contributions with status</CardDescription>
        </CardHeader>
        <CardContent data-tour="admin-contributions">
          {recentLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : recentContributions.length === 0 ? (
            // F4.5 — empty state with action
            <Empty
              icon={DollarSign}
              title="No contributions recorded yet"
              action={
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/contributions'}>
                  View Contributions
                </Button>
              }
            />
          ) : (
            <>
              {/* F4.4 — Mobile card view with proper hover feedback */}
              <div className="space-y-2 md:hidden">
                {recentContributions.map((contribution) => (
                  <div key={contribution.id} className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-default">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{contribution.member.fullName}</div>
                      <ContributionStatusBadge status={contribution.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{contribution.category.name}</span>
                      <span>{new Date(contribution.transactionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="font-semibold text-sm text-right">
                      KES {Number.parseFloat(contribution.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm">Date</th>
                      <th className="text-left p-3 font-medium text-sm">Member</th>
                      <th className="text-left p-3 font-medium text-sm">Department</th>
                      <th className="text-right p-3 font-medium text-sm">Amount</th>
                      <th className="text-center p-3 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentContributions.map((contribution) => (
                      <tr key={contribution.id} className="border-b hover:bg-muted/50 transition-colors h-12">
                        <td className="p-3 text-sm">
                          {new Date(contribution.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="font-medium">{contribution.member.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {contribution.member.phoneNumber}
                          </div>
                        </td>
                        <td className="p-3 text-sm">{contribution.category.name}</td>
                        <td className="p-3 text-sm text-right font-semibold">
                          KES {Number.parseFloat(contribution.amount).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <ContributionStatusBadge status={contribution.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Member Stats — F4.3 consistent text size */}
      <div data-tour="admin-members" className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Total registered members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{stats?.totalMembers || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats?.activeMembers || 0} active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Contributions</span>
              <span className="font-semibold">{stats?.totalCount || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Avg per Member</span>
              <span className="font-semibold">
                KES{" "}
                {stats?.totalMembers && stats?.totalCount
                  ? (Number.parseFloat(stats.totalAmount) / stats.totalMembers).toFixed(0)
                  : "0"}
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
