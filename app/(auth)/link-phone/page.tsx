/**
 * Phone Number Gating & Linking Page
 * Intercepts email-authenticated users to link a phone number.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "@/lib/auth/auth-context";
import { CHECK_AND_LINK_PHONE } from "@/lib/graphql/auth-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Phone, ArrowLeft } from "lucide-react";

function LinkPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeAuth } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkingToken, setLinkingToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("linking_token");
      const savedEmail = sessionStorage.getItem("gated_email");
      if (!token) {
        toast.error("Session expired or invalid. Please log in again.");
        router.push("/login");
        return;
      }
      setLinkingToken(token);
      setEmail(savedEmail || "your email");
    }
  }, [router]);

  const [checkAndLinkPhone] = useMutation<{
    checkAndLinkPhone: {
      success: boolean;
      message: string;
      accessToken?: string;
      refreshToken?: string;
      userId?: number;
      memberId?: number;
      phoneNumber?: string;
      email?: string;
      fullName?: string;
      needsRegistration?: boolean;
      registrationToken?: string;
    };
  }>(CHECK_AND_LINK_PHONE);

  const handlePhoneChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget as unknown as { value: string };
    let value = (target.value || "").replaceAll(/\D/g, "");

    if (value.startsWith("0")) {
      value = value.substring(1);
    }

    value = value.substring(0, 9);
    setPhoneNumber(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (phoneNumber.length !== 9) {
      toast.error("Please enter a valid 9-digit phone number");
      return;
    }

    if (!linkingToken) {
      toast.error("Invalid linking session. Please try logging in again.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `254${phoneNumber}`;
      const { data } = await checkAndLinkPhone({
        variables: {
          phoneNumber: fullPhone,
          linkingToken,
        },
      });

      const resp = data?.checkAndLinkPhone;

      if (resp?.success) {
        if (resp.needsRegistration) {
          if (resp.registrationToken) {
            sessionStorage.setItem("registration_token", resp.registrationToken);
          }
          toast.success("Phone verified. Please complete your registration details.");
          router.push("/register");
        } else if (resp.accessToken) {
          completeAuth({
            accessToken: resp.accessToken,
            refreshToken: resp.refreshToken || null,
            userId: resp.userId ?? 0,
            memberId: resp.memberId ?? 0,
            phoneNumber: resp.phoneNumber || fullPhone,
            email: resp.email || email,
            fullName: resp.fullName ?? "",
          });

          // Clean up tokens
          sessionStorage.removeItem("linking_token");
          sessionStorage.removeItem("gated_email");

          toast.success("Account successfully linked!");
          router.push(redirectTo);
        } else {
          toast.error("Failed to complete linking: session details missing");
        }
      } else {
        toast.error(resp?.message || "Failed to link phone number");
      }
    } catch (error) {
      console.error("Linking error:", error);
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to link phone number. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/5 flex flex-col overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
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
                  <Phone className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Link Phone Number
              </CardTitle>
              <CardDescription className="text-base px-2">
                To secure your account, please enter your mobile number. This links your email <strong className="text-foreground">{email}</strong> to your member profile.
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
                    Enter your 9-digit mobile number (e.g., 798765432)
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
                      Linking Account...
                    </>
                  ) : (
                    "Verify & Link Phone"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  Already have a linked account? Use the matching number to retrieve it automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function LinkPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LinkPhoneContent />
    </Suspense>
  );
}
