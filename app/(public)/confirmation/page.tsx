/**
 * Contribution Confirmation Page
 * Sprint 1: MVP - Core Payment Flow
 *
 * Shows payment confirmation details after successful STK Push initiation
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_CONTRIBUTION } from "@/lib/graphql/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react";

interface Contribution {
  id: string;
  amount: string;
  status: string;
  transactionDate: string | null;
  member: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  category: {
    id: string;
    name: string;
  };
  mpesaTransaction: {
    id: string;
    mpesaReceiptNumber: string | null;
    resultDesc: string | null;
  } | null;
}

interface GetContributionData {
  contribution: Contribution | null;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contributionId = searchParams.get("id");
  const checkoutRequestId = searchParams.get("checkoutRequestId");

  const [isPolling, setIsPolling] = useState(true);

  const { data, loading, error, refetch } = useQuery<GetContributionData>(GET_CONTRIBUTION, {
    variables: { id: contributionId || "" },
    skip: !contributionId,
    pollInterval: isPolling ? 5000 : 0, // Poll every 5 seconds
  });

  const contribution = data?.contribution;

  // Stop polling after 2 minutes or when status changes from pending
  useEffect(() => {
    if (!contribution) return;

    const timeout = setTimeout(() => {
      setIsPolling(false);
    }, 120000); // 2 minutes

    if (contribution.status !== "pending") {
      setIsPolling(false);
    }

    return () => clearTimeout(timeout);
  }, [contribution]);

  // Redirect if no contribution ID
  if (!contributionId && !checkoutRequestId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Request</CardTitle>
            <CardDescription>No contribution information found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/contribute")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contribute
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading contribution details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contribution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              {error?.message || "Could not load contribution details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => refetch()} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => router.push("/contribute")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contribute
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (contribution.status) {
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950",
          borderColor: "border-green-200 dark:border-green-800",
          title: "Payment Successful!",
          description: "Your contribution has been received and processed.",
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950",
          borderColor: "border-red-200 dark:border-red-800",
          title: "Payment Failed",
          description: contribution.mpesaTransaction?.resultDesc || "The payment could not be processed.",
        };
      default: // pending
        return {
          icon: Clock,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-950",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          title: "Payment Pending",
          description: "Waiting for M-Pesa confirmation. Please check your phone.",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/contribute")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contribute
        </Button>

        {/* Status Card */}
        <Card className={`${statusConfig.borderColor} ${statusConfig.bgColor}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
              <div>
                <CardTitle className={statusConfig.color}>
                  {statusConfig.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {statusConfig.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {contribution.status === "pending" && isPolling && (
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Auto-refreshing status...</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Contribution Details */}
        <Card>
          <CardHeader>
            <CardTitle>Contribution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">KES {Number.parseFloat(contribution.amount).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-semibold">{contribution.category.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">{contribution.status}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-semibold">
                  {contribution.transactionDate
                    ? new Date(contribution.transactionDate).toLocaleDateString()
                    : "Pending"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Member</p>
                <p className="text-lg font-semibold">{contribution.member.fullName}</p>
                <p className="text-sm text-muted-foreground">{contribution.member.phoneNumber}</p>
              </div>

              {contribution.mpesaTransaction?.mpesaReceiptNumber && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">M-Pesa Receipt</p>
                  <p className="font-mono text-sm font-semibold">
                    {contribution.mpesaTransaction.mpesaReceiptNumber}
                  </p>
                </div>
              )}

              {checkoutRequestId && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Checkout Reference</p>
                  <p className="font-mono text-sm">
                    {checkoutRequestId}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps for Pending */}
        {contribution.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Check your phone for the M-Pesa prompt</li>
                <li>Enter your M-Pesa PIN to complete the payment</li>
                <li>You&apos;ll receive a confirmation SMS from M-Pesa</li>
                <li>This page will update automatically when payment is confirmed</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {contribution.status === "pending" && (
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          )}

          <Button
            onClick={() => router.push("/contribute")}
            className="flex-1"
          >
            Make Another Contribution
          </Button>
        </div>
      </div>
    </div>
  );
}
