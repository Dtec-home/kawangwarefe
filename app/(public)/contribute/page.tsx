"use client";

import { useRouter } from "next/navigation";
import { ContributionForm } from "@/components/forms/contribution-form";
import { Navigation } from "@/components/landing/navigation";

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-3 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Church Contribution Portal
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Make your contribution securely via M-Pesa
            </p>
          </div>

          {/* Contribution Form */}
          <div className="animate-slide-up">
            <ContributionForm onSuccess={handleSuccess} />
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm text-muted-foreground animate-slide-up">
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">🔒 Secure</span>
              <span className="text-xs">M-Pesa gateway</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">⚡ Instant</span>
              <span className="text-xs">Immediate receipt</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">📊 Tracked</span>
              <span className="text-xs">View history</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}