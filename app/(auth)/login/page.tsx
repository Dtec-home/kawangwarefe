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

    // Validate phone number
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Phone number must be in format 254XXXXXXXXX");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await requestOtp({
        variables: { phoneNumber },
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

        // Navigate to OTP verification page
        router.push(`/verify-otp?phone=${phoneNumber}`);
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    let cleaned = value.replace(/\D/g, "");

    // If starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.substring(1);
    }

    // Limit to 12 digits (254XXXXXXXXX)
    cleaned = cleaned.substring(0, 12);

    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
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
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="254712345678"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                disabled={isSubmitting}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Enter your M-Pesa number (e.g., 254712345678)
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || phoneNumber.length !== 12}
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
