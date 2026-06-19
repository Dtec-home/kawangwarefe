"use client";

import { useRouter } from "next/navigation";
import { ContributionForm } from "@/components/forms/contribution-form";
import { Navigation } from "@/components/landing/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { MemberLayout } from "@/components/layouts/member-layout";
import { useTour } from "@/hooks/use-tour";
import { CONTRIBUTION_FLOW_TOUR_CONFIG } from "@/lib/tours/tour-configs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function ContributePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { start: startContributionTour } = useTour({
    tourKey: "contribution_flow",
    steps: CONTRIBUTION_FLOW_TOUR_CONFIG.steps || [],
    autoStart: false,
  });

  const handleSuccess = (data: any) => {
    // Redirect to confirmation page with contribution details
    const contributionId = data?.contribution?.id;
    const checkoutRequestId = data?.checkoutRequestId;

    if (contributionId) {
      router.push(
        `/confirmation?id=${contributionId}&checkoutRequestId=${checkoutRequestId || ""}`
      );
    } else if (checkoutRequestId) {
      // Multi-category flow: no single contributionId — navigate by checkoutRequestId
      router.push(`/confirmation?checkoutRequestId=${checkoutRequestId}`);
    }
  };

  const content = (
    <>
      {/* Gradient Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-transparent border-b border-border">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="text-center space-y-3 animate-fade-in max-w-3xl mx-auto">
            <div className="inline-block mb-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
                Secure Giving
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tracking-tight">
              Church Contribution Portal
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Make your contribution securely via M-Pesa. Your generosity supports our ministry and community outreach programs.
            </p>
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="bg-muted/40 border-b backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="hover:bg-muted/60"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startContributionTour()}
              title="View contribution guide"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              How to Contribute
            </Button>
          </div>

          <div data-tour="contribution-form" className="animate-slide-up">
            <ContributionForm onSuccess={handleSuccess} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
            <Card className="flex flex-col items-center gap-2 p-4 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-2xl">🔒</span>
              <span className="font-semibold text-primary">Secure</span>
              <span className="text-xs text-muted-foreground">M-Pesa gateway</span>
            </Card>
            <Card className="flex flex-col items-center gap-2 p-4 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-2xl">⚡</span>
              <span className="font-semibold text-info">Instant</span>
              <span className="text-xs text-muted-foreground">Immediate receipt</span>
            </Card>
            <Card className="flex flex-col items-center gap-2 p-4 shadow-sm hover:bg-muted/60 transition-colors">
              <span className="text-2xl">📊</span>
              <span className="font-semibold text-primary">Tracked</span>
              <span className="text-xs text-muted-foreground">View history</span>
            </Card>
          </div>
        </div>
      </main>
    </>
  );

  return isAuthenticated ? (
    <MemberLayout>{content}</MemberLayout>
  ) : (
    <div className="min-h-screen bg-background">
      <Navigation />
      {content}
    </div>
  );
}