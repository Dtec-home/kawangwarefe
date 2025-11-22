/**
 * Public Contribution Page
 * Sprint 1: MVP - Core Payment Flow
 */

"use client";

import React, { useState } from "react";
import { ContributionForm } from "@/components/forms/contribution-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

export default function ContributePage() {
  const [contributionResult, setContributionResult] = useState<any>(null);

  const handleSuccess = (data: any) => {
    setContributionResult(data);
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

        {/* Success Message */}
        {contributionResult && contributionResult.success && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-green-900 dark:text-green-100">
                  Payment Initiated Successfully
                </CardTitle>
              </div>
              <CardDescription className="text-green-700 dark:text-green-300">
                {contributionResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Next Steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-300 mt-2">
                    <li>Check your phone for the M-Pesa prompt</li>
                    <li>Enter your M-Pesa PIN to complete the payment</li>
                    <li>You'll receive a confirmation SMS from M-Pesa</li>
                  </ol>
                </div>
              </div>

              {contributionResult.checkoutRequestId && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Checkout Reference
                  </p>
                  <p className="font-mono text-sm">
                    {contributionResult.checkoutRequestId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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