/**
 * Public Contribution Page
 * Sprint 1: MVP - Core Payment Flow
 */

"use client";

import { useRouter } from "next/navigation";
import { ContributionForm } from "@/components/forms/contribution-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContributePage() {
  const router = useRouter();

  const handleSuccess = (data: any) => {
    // Redirect to confirmation page with contribution details
    const contributionId = data.contribution?.id;
    const checkoutRequestId = data.checkoutRequestId;

    if (contributionId) {
      router.push(
        `/confirmation?id=${contributionId}&checkoutRequestId=${checkoutRequestId || ""}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Church Contribution Portal
          </h1>
          <p className="text-lg text-muted-foreground">
            Make your contribution securely via M-Pesa
          </p>
        </div>

        {/* Contribution Form */}
        <ContributionForm onSuccess={handleSuccess} />

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secure Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              All contributions are processed through M-Pesa's secure payment gateway.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instant Receipt</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You'll receive an M-Pesa confirmation message immediately after payment.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Track History</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              All your contributions are tracked and can be viewed in your history.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}