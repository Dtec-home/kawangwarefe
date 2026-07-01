/**
 * Login Page - Phone Number Input
 * Sprint 2: Authentication & Member Dashboard
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "@/lib/auth/auth-context";
import { REQUEST_OTP } from "@/lib/graphql/auth-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read redirect target from query params (set by middleware)
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, authLoading, router, redirectTo]);

  const [requestOtp] = useMutation<
    { requestOtp: { success: boolean; message: string; otpCode?: string } },
    { phoneNumber: string }
  >(REQUEST_OTP);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number (should be 9 digits)
    if (phoneNumber.length !== 9) {
      toast.error("Please enter a valid 9-digit phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send with 254 prefix
      const fullPhone = `254${phoneNumber}`;
      const { data } = await requestOtp({
        variables: { phoneNumber: fullPhone },
      });

      const resp = data?.requestOtp;

      if (resp?.success) {
        toast.success(resp.message);

        // For development - show OTP in toast
        if (resp.otpCode) {
          toast.success(`OTP Code: ${resp.otpCode}`, {
            duration: 10000,
          });
        }

        // Navigate to OTP verification page (send full phone with 254)
        const redirectParam = redirectTo === "/dashboard" ? "" : `&redirect=${encodeURIComponent(redirectTo)}`;
        const verifyUrl = `/verify-otp?phone=${fullPhone}${redirectParam}`;
        router.push(verifyUrl);
      } else {
        toast.error(resp?.message || "Failed to request OTP");
      }
    } catch (error) {
      console.error("OTP request error:", error);
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // Only allow digits
    const target = e.currentTarget as unknown as { value: string };
    let value = (target.value || "").replaceAll(/\D/g, "");

    // If user starts with 0, remove it (they should just type 798765432)
    if (value.startsWith("0")) {
      value = value.substring(1);
    }

    // Limit to 9 digits
    value = value.substring(0, 9);

    setPhoneNumber(value);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/5 flex flex-col overflow-hidden">
      {/* Decorative blur circles (like homepage) */}
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header with back to home */}
      <header className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 font-bold text-lg hover:opacity-80 transition-opacity">
              <div className="relative w-10 h-10">
                <img
                  src="/logo.png"
                  alt="SDA Church"
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="hidden sm:inline">SDA Kawangware</span>
            </a>
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-xl border-none bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader className="text-center space-y-2 pb-4">
              <div className="flex justify-center mb-2">
                <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Member Login</CardTitle>
              <CardDescription className="text-base">
                Enter your phone number to receive a verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-base font-medium">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      +254
                    </div>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="798765432"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      required
                      disabled={isSubmitting}
                      className="text-lg pl-16 h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your 9-digit M-Pesa number (e.g., 798765432)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isSubmitting || phoneNumber.length !== 9}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  Don&apos;t have an account? Enter your phone number above
                  to register.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
