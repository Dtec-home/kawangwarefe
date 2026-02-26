/**
 * C2B Transactions Admin Page
 *
 * View and resolve unmatched Pay Bill (C2B) transactions from M-Pesa
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_C2B_TRANSACTIONS,
  GET_C2B_TRANSACTION_STATS,
  RESOLVE_UNMATCHED_C2B,
} from "@/lib/graphql/c2b-queries";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { AdminLayout } from "@/components/layouts/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Filter,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Types ───────────────────────────────────────────────────── */

interface C2BTransaction {
  id: string;
  transId: string;
  transTime: string;
  transAmount: string;
  billRefNumber: string;
  msisdn: string;
  customerName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  status: "received" | "processed" | "unmatched" | "failed";
  matchedCategoryCode: string;
  matchMethod: string;
  createdAt: string;
}

interface C2BTransactionsData {
  c2bTransactions: {
    items: C2BTransaction[];
    total: number;
    hasMore: boolean;
  };
}

interface C2BStatsData {
  c2bTransactionStats: {
    totalAmount: string;
    totalCount: number;
    processedCount: number;
    unmatchedCount: number;
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

/* ── Status badge helpers ─────────────────────────────────────── */

function statusBadge(status: C2BTransaction["status"]) {
  const map: Record<C2BTransaction["status"], string> = {
    received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    processed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    unmatched:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };
  return `inline-block px-2 py-1 text-xs rounded-full ${map[status] ?? "bg-slate-100 text-slate-800"}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtAmount(amount: string) {
  return `KES ${Number.parseFloat(amount).toLocaleString()}`;
}

/* ── Resolve Modal ────────────────────────────────────────────── */

interface ResolveModalProps {
  transaction: C2BTransaction;
  categories: Category[];
  onClose: () => void;
  onResolved: () => void;
}

function ResolveModal({
  transaction,
  categories,
  onClose,
  onResolved,
}: ResolveModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [resolveC2B, { loading }] = useMutation(RESOLVE_UNMATCHED_C2B, {
    onCompleted: (data) => {
      if (data.resolveUnmatchedC2b.success) {
        toast.success("Transaction resolved successfully");
        onResolved();
        onClose();
      } else {
        toast.error(data.resolveUnmatchedC2b.message || "Resolution failed");
      }
    },
    onError: (err) => {
      toast.error(err.message || "An error occurred");
    },
  });

  const handleResolve = () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    resolveC2B({
      variables: {
        transactionId: transaction.id,
        categoryId: selectedCategory,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Resolve Unmatched Transaction</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assign a contribution category to complete this transaction.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Transaction summary */}
          <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trans ID</span>
              <span className="font-mono font-medium">{transaction.transId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span>{transaction.customerName || transaction.msisdn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono">{transaction.msisdn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono">{transaction.billRefNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-green-700 dark:text-green-400">
                {fmtAmount(transaction.transAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{fmtDate(transaction.transTime)}</span>
            </div>
          </div>

          {/* Category selector */}
          <div className="space-y-2">
            <Label htmlFor="resolve-category">Assign Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="resolve-category">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}{" "}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({cat.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            This will create a completed contribution record and send an SMS receipt
            to the customer.
          </p>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={loading || !selectedCategory}>
            {loading ? "Resolving..." : "Resolve Transaction"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */

export default function C2BTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resolvingTx, setResolvingTx] = useState<C2BTransaction | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data: categoriesData } = useQuery<CategoriesData>(
    GET_CONTRIBUTION_CATEGORIES
  );
  const categories = categoriesData?.contributionCategories || [];

  const { data: statsData, refetch: refetchStats } =
    useQuery<C2BStatsData>(GET_C2B_TRANSACTION_STATS);
  const stats = statsData?.c2bTransactionStats;

  const {
    data,
    loading,
    error,
    refetch: refetchTx,
  } = useQuery<C2BTransactionsData>(GET_C2B_TRANSACTIONS, {
    variables: {
      status: statusFilter !== "all" ? statusFilter : null,
      pagination: { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    },
  });

  const transactions = data?.c2bTransactions.items || [];
  const total = data?.c2bTransactions.total ?? 0;
  const hasMore = data?.c2bTransactions.hasMore ?? false;

  const refetchAll = () => {
    refetchTx();
    refetchStats();
  };

  const handleResolved = () => {
    setPage(0);
    refetchAll();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">C2B Transactions</h1>
            <p className="text-muted-foreground">
              M-Pesa Pay Bill payments — review and resolve unmatched transactions
            </p>
          </div>
          <Button variant="outline" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fmtAmount(stats.totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCount} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.processedCount}
                </div>
                <p className="text-xs text-muted-foreground">Successfully matched</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.unmatchedCount}
                </div>
                <p className="text-xs text-muted-foreground">Needs manual resolution</p>
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
                <p className="text-xs text-muted-foreground">Failed transactions</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Unmatched alert banner */}
        {stats && stats.unmatchedCount > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {stats.unmatchedCount} unmatched transaction
                {stats.unmatchedCount !== 1 ? "s" : ""} need attention
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">
                These are Pay Bill payments where the account reference didn&apos;t
                match any category code. Resolve them by assigning the correct
                category.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto shrink-0 border-yellow-400 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-800"
              onClick={() => setStatusFilter("unmatched")}
            >
              View Unmatched
            </Button>
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
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 min-w-[180px]">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => { setStatusFilter("all"); setPage(0); }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Pay Bill Transactions
            </CardTitle>
            <CardDescription>
              {total} transaction{total !== 1 ? "s" : ""} found
              {statusFilter !== "all" && ` · filtered by: ${statusFilter}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading transactions...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-600">
                Error: {error.message}
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            )}

            {!loading && !error && transactions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Trans ID</th>
                        <th className="text-left p-3 font-medium">Customer</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Reference</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-center p-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="p-3 whitespace-nowrap">
                            {fmtDate(tx.transTime)}
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {tx.transId}
                          </td>
                          <td className="p-3">
                            {tx.customerName || (
                              <span className="text-muted-foreground italic">
                                Unknown
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono">{tx.msisdn}</td>
                          <td className="p-3 font-mono text-xs">
                            {tx.billRefNumber || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {fmtAmount(tx.transAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={statusBadge(tx.status)}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs">
                            {tx.matchedCategoryCode ? (
                              <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                {tx.matchedCategoryCode}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {tx.matchMethod && tx.matchMethod !== "manual" && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({tx.matchMethod})
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {tx.status === "unmatched" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-700 border-yellow-400 hover:bg-yellow-50 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                                onClick={() => setResolvingTx(tx)}
                              >
                                Resolve
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore}
                      onClick={() => setPage((p) => p + 1)}
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

      {/* Resolve Modal */}
      {resolvingTx && (
        <ResolveModal
          transaction={resolvingTx}
          categories={categories}
          onClose={() => setResolvingTx(null)}
          onResolved={handleResolved}
        />
      )}
    </AdminLayout>
  );
}
