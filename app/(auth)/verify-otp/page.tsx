/**
 * OTP Verification Page
 * Sprint 2: Authentication & Member Dashboard
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone") || "";
  const { login } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Redirect if no phone number
    if (!phoneNumber) {
      router.push("/login");
    }
  }, [phoneNumber, router]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value && newOtp.every((digit) => digit !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();

      // Auto-submit pasted OTP
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (otpCode?: string) => {
    const code = otpCode || otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(phoneNumber, code);

      if (result.success) {
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        toast.error(result.message);
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/login")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold">{phoneNumber}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label className="text-center block">Verification Code</Label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isSubmitting}
                      className="w-12 h-14 text-center text-2xl font-semibold"
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Valid for 10 minutes
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || otp.some((digit) => !digit)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => router.push("/login")}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground"
              >
                Didn&apos;t receive code? Request new OTP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
