/**
 * Login Page - Phone Number Input
 * Sprint 2: Authentication & Member Dashboard
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { REQUEST_OTP } from "@/lib/graphql/auth-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        router.push(`/verify-otp?phone=${fullPhone}`);
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    let value = e.target.value.replace(/\D/g, "");

    // If user starts with 0, remove it (they should just type 797030300)
    if (value.startsWith("0")) {
      value = value.substring(1);
    }

    // Limit to 9 digits
    value = value.substring(0, 9);

    setPhoneNumber(value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back to home */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold">Member Login</CardTitle>
              <CardDescription className="text-base">
                Enter your phone number to receive a verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-base">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      +254
                    </div>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="797030300"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      required
                      disabled={isSubmitting}
                      className="text-lg pl-16 h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your 9-digit M-Pesa number (e.g., 797030300)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
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

              <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
                <p>Don&apos;t have an account?</p>
                <p>Contact church admin to register</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
