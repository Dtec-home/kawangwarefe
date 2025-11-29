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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Member Login</CardTitle>
          <CardDescription>
            Enter your phone number to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
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
                  className="text-lg pl-16"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your 9-digit M-Pesa number (e.g., 797030300)
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || phoneNumber.length !== 9}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don&apos;t have an account?</p>
            <p className="mt-1">Contact church admin to register</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
