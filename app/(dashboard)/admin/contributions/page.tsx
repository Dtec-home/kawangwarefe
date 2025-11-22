/**
 * Admin Contributions Page
 * Sprint 3: Admin Dashboard
 *
 * View and manage all contributions
 */

"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_CONTRIBUTIONS, GET_CONTRIBUTION_STATS } from "@/lib/graphql/admin-queries";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Search, Filter, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";

interface Contribution {
  id: string;
  amount: string;
  status: string;
  transactionDate: string | null;
  notes: string | null;
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

export default function ContributionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Get categories
  const { data: categoriesData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const categories = categoriesData?.contributionCategories || [];

  // Get stats
  const { data: statsData } = useQuery<StatsData>(GET_CONTRIBUTION_STATS);
  const stats = statsData?.contributionStats;

  // Get contributions with filters
  const { data, loading, error, refetch } = useQuery<ContributionsData>(GET_ALL_CONTRIBUTIONS, {
    variables: {
      filters: {
        status: statusFilter !== "all" ? statusFilter : null,
        categoryId: categoryFilter !== "all" ? categoryFilter : null,
        search: searchTerm || null,
      },
      pagination: {
        limit: 100,
        offset: 0,
      },
    },
  });

  const contributions = data?.allContributions.items || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Contributions</h1>
          <p className="text-muted-foreground">View and manage all church contributions</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Phone number, name, receipt..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
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
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contributions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contributions</CardTitle>
            <CardDescription>
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                No contributions found
              </div>
            )}

            {!loading && !error && contributions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Member</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((contribution) => (
                      <tr
                        key={contribution.id}
                        className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <td className="p-3 text-sm">
                          {contribution.transactionDate
                            ? new Date(contribution.transactionDate).toLocaleDateString('en-GB', {
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
                            <div className="font-medium">{contribution.member.fullName}</div>
                            {contribution.member.memberNumber && (
                              <div className="text-xs text-muted-foreground">
                                #{contribution.member.memberNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm font-mono">
                          {contribution.member.phoneNumber}
                        </td>
                        <td className="p-3 text-sm">
                          <div>
                            <div>{contribution.category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {contribution.category.code}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-right font-semibold">
                          KES {Number.parseFloat(contribution.amount).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              contribution.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : contribution.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            }`}
                          >
                            {contribution.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-mono">
                          {contribution.mpesaTransaction?.mpesaReceiptNumber || '-'}
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
