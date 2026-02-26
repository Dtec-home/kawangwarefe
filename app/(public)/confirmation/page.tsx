/**
 * Contribution Confirmation Page
 * Sprint 1: MVP - Core Payment Flow
 *
 * Shows payment confirmation details after successful STK Push.
 * Supports two modes:
 *  1. Single-category: ?id=<contributionId>   (uses GET_CONTRIBUTION query)
 *  2. Multi-category:  ?checkoutRequestId=<id> (uses GET_CONTRIBUTIONS_BY_CHECKOUT_ID query)
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_CONTRIBUTION } from "@/lib/graphql/queries";
import { GET_CONTRIBUTIONS_BY_CHECKOUT_ID } from "@/lib/graphql/payment-status-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";

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

interface GetContributionsByCheckoutData {
  contributionsByCheckoutId: Contribution[];
}

function StatusIcon({ status }: { status: string }) {
  const cfg = getStatusConfig(status, null);
  const Icon = cfg.icon;
  return <Icon className={`h-8 w-8 ${cfg.color}`} />;
}

function getStatusConfig(status: string, resultDesc: string | null | undefined) {
  switch (status) {
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
        description: resultDesc || "The payment could not be processed.",
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
}

// ─── Single-contribution mode ──────────────────────────────────────────────
function SingleContributionConfirmation({
  contributionId,
  checkoutRequestId,
}: {
  contributionId: string;
  checkoutRequestId: string;
}) {
  const router = useRouter();
  const [isPolling, setIsPolling] = useState(true);

  const { data, loading, error, refetch } = useQuery<GetContributionData>(GET_CONTRIBUTION, {
    variables: { id: contributionId },
    pollInterval: isPolling ? 5000 : 0,
    fetchPolicy: "network-only",
  });

  const contribution = data?.contribution;

  useEffect(() => {
    if (!contribution) return;
    const timeout = setTimeout(() => setIsPolling(false), 120000);
    if (contribution.status !== "pending") setIsPolling(false);
    return () => clearTimeout(timeout);
  }, [contribution]);

  if (loading) return <LoadingCard />;
  if (error || !contribution) return <ErrorCard message={error?.message} onRetry={refetch} onBack={() => router.push("/contribute")} />;

  const statusConfig = getStatusConfig(contribution.status, contribution.mpesaTransaction?.resultDesc);
  const StatusIconEl = statusConfig.icon;

  return (
    <ConfirmationLayout>
      <StatusCard config={statusConfig} isPolling={isPolling} status={contribution.status}>
        <StatusIconEl className={`h-8 w-8 ${statusConfig.color}`} />
      </StatusCard>

      <DetailsCard>
        <DetailRow label="Amount" value={`KES ${Number.parseFloat(contribution.amount).toLocaleString()}`} />
        <DetailRow label="Category" value={contribution.category.name} />
        <DetailRow label="Status" value={<span className="capitalize">{contribution.status}</span>} />
        <DetailRow
          label="Date"
          value={contribution.transactionDate ? new Date(contribution.transactionDate).toLocaleDateString() : "Pending"}
        />
        <DetailRow label="Member" value={contribution.member.fullName} subValue={contribution.member.phoneNumber} wide />
        {contribution.mpesaTransaction?.mpesaReceiptNumber && (
          <DetailRow label="M-Pesa Receipt" value={<span className="font-mono">{contribution.mpesaTransaction.mpesaReceiptNumber}</span>} wide />
        )}
        {checkoutRequestId && (
          <DetailRow label="Checkout Reference" value={<span className="font-mono text-xs">{checkoutRequestId}</span>} wide />
        )}
      </DetailsCard>

      {contribution.status === "pending" && <PendingStepsCard />}

      <ActionButtons
        isPending={contribution.status === "pending"}
        isCompleted={contribution.status === "completed"}
        onRefetch={refetch}
      />
    </ConfirmationLayout>
  );
}

// ─── Multi-contribution mode ───────────────────────────────────────────────
function MultiContributionConfirmation({ checkoutRequestId }: { checkoutRequestId: string }) {
  const router = useRouter();
  const [isPolling, setIsPolling] = useState(true);

  const { data, loading, error, refetch } = useQuery<GetContributionsByCheckoutData>(
    GET_CONTRIBUTIONS_BY_CHECKOUT_ID,
    {
      variables: { checkoutRequestId },
      pollInterval: isPolling ? 5000 : 0,
      fetchPolicy: "network-only",
    }
  );

  const contributions = data?.contributionsByCheckoutId ?? [];
  // Derive overall status: completed only if ALL are completed; failed if any failed
  const overallStatus = (() => {
    if (contributions.length === 0) return "pending";
    if (contributions.every((c) => c.status === "completed")) return "completed";
    if (contributions.some((c) => c.status === "failed")) return "failed";
    return "pending";
  })();

  const firstContrib = contributions[0];

  useEffect(() => {
    const timeout = setTimeout(() => setIsPolling(false), 120000);
    if (overallStatus !== "pending") setIsPolling(false);
    return () => clearTimeout(timeout);
  }, [overallStatus]);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error.message} onRetry={refetch} onBack={() => router.push("/contribute")} />;

  const statusConfig = getStatusConfig(
    overallStatus,
    firstContrib?.mpesaTransaction?.resultDesc
  );
  const StatusIconEl = statusConfig.icon;

  const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const receiptNumber = firstContrib?.mpesaTransaction?.mpesaReceiptNumber;

  return (
    <ConfirmationLayout>
      <StatusCard config={statusConfig} isPolling={isPolling} status={overallStatus}>
        <StatusIconEl className={`h-8 w-8 ${statusConfig.color}`} />
      </StatusCard>

      <DetailsCard>
        <DetailRow label="Total Amount" value={`KES ${totalAmount.toLocaleString()}`} />
        <DetailRow label="Status" value={<span className="capitalize">{overallStatus}</span>} />
        {firstContrib && (
          <DetailRow label="Member" value={firstContrib.member.fullName} subValue={firstContrib.member.phoneNumber} wide />
        )}
        {receiptNumber && (
          <DetailRow label="M-Pesa Receipt" value={<span className="font-mono">{receiptNumber}</span>} wide />
        )}
        <DetailRow label="Checkout Reference" value={<span className="font-mono text-xs">{checkoutRequestId}</span>} wide />

        {/* Per-category breakdown */}
        {contributions.length > 0 && (
          <div className="col-span-2 pt-2">
            <p className="text-sm text-muted-foreground mb-2">Breakdown</p>
            <div className="space-y-1">
              {contributions.map((c) => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span>{c.category.name}</span>
                  <span className="font-medium">KES {Number.parseFloat(c.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailsCard>

      {overallStatus === "pending" && <PendingStepsCard />}

      <ActionButtons
        isPending={overallStatus === "pending"}
        isCompleted={overallStatus === "completed"}
        onRefetch={refetch}
      />
    </ConfirmationLayout>
  );
}

// ─── Shared UI building blocks ─────────────────────────────────────────────
function LoadingCard() {
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

function ErrorCard({
  message,
  onRetry,
  onBack,
}: {
  message?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>{message || "Could not load contribution details"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button onClick={onBack} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contribute
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push("/contribute")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contribute
        </Button>
        {children}
      </div>
    </div>
  );
}

function StatusCard({
  config,
  isPolling,
  status,
  children,
}: {
  config: ReturnType<typeof getStatusConfig>;
  isPolling: boolean;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {children}
          <div>
            <CardTitle className={config.color}>{config.title}</CardTitle>
            <CardDescription className="mt-1">{config.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {status === "pending" && isPolling && (
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Auto-refreshing status...</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function DetailsCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">{children}</div>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  subValue,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {subValue && <p className="text-sm text-muted-foreground">{subValue}</p>}
    </div>
  );
}

function PendingStepsCard() {
  return (
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
  );
}

function ActionButtons({
  isPending,
  isCompleted,
  onRefetch,
}: {
  isPending: boolean;
  isCompleted: boolean;
  onRefetch: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {isPending && (
          <Button onClick={onRefetch} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
        )}
        <Button onClick={() => router.push("/contribute")} className="flex-1">
          Make Another Contribution
        </Button>
      </div>
      {isCompleted && (
        <LoginButton variant="secondary" className="w-full">
          Login to View Dashboard
        </LoginButton>
      )}
    </div>
  );
}

// ─── Root component ────────────────────────────────────────────────────────
function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contributionId = searchParams.get("id");
  const checkoutRequestId = searchParams.get("checkoutRequestId");

  // Route to the appropriate mode
  if (contributionId) {
    return (
      <SingleContributionConfirmation
        contributionId={contributionId}
        checkoutRequestId={checkoutRequestId ?? ""}
      />
    );
  }

  if (checkoutRequestId) {
    return <MultiContributionConfirmation checkoutRequestId={checkoutRequestId} />;
  }

  // No params at all
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

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
