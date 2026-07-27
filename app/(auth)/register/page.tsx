/**
 * Self-Registration Page - Complete profile after OTP verification
 * Collects: first name, last name, department, group
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAuth } from "@/lib/auth/auth-context";
import { COMPLETE_REGISTRATION, REGISTRATION_OPTIONS, REGISTER_WITH_PHONE_LINKING } from "@/lib/graphql/auth-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string;
}

interface Group {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, completeAuth } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRegistrationToken(sessionStorage.getItem("registration_token"));
    }
  }, []);

  const { data: options, loading: optionsLoading } = useQuery<{
    registrationDepartments: Department[];
    registrationGroups: Group[];
  }>(REGISTRATION_OPTIONS);

  const [completeRegistration] = useMutation<{
    completeRegistration: {
      success: boolean;
      message: string;
      member?: { id: string; fullName: string; isGuest: boolean };
    };
  }>(COMPLETE_REGISTRATION);

  const [registerWithPhoneLinking] = useMutation<{
    registerWithPhoneLinking: {
      success: boolean;
      message: string;
      accessToken?: string;
      refreshToken?: string;
      userId?: number;
      memberId?: number;
      phoneNumber?: string;
      email?: string;
      fullName?: string;
    };
  }>(REGISTER_WITH_PHONE_LINKING);

  // Redirect only if not authenticated AND there is no registration token in storage
  useEffect(() => {
    if (!authLoading) {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("registration_token") : null;
      if (!isAuthenticated && !token) {
        router.replace("/login");
      }
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (trimmedFirst.length < 2 || trimmedLast.length < 2) {
      toast.error("Names must be at least 2 characters");
      return;
    }

    setIsSubmitting(true);

    if (registrationToken) {
      try {
        const { data } = await registerWithPhoneLinking({
          variables: {
            registrationToken,
            firstName: trimmedFirst,
            lastName: trimmedLast,
            departmentId: departmentId || null,
            groupId: groupId || null,
          },
        });

        const result = data?.registerWithPhoneLinking;

        if (result?.success && result.accessToken) {
          completeAuth({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            userId: result.userId ?? 0,
            memberId: result.memberId ?? 0,
            phoneNumber: result.phoneNumber,
            email: result.email,
            fullName: result.fullName ?? `${trimmedFirst} ${trimmedLast}`,
          });

          // Clean up tokens
          sessionStorage.removeItem("registration_token");
          sessionStorage.removeItem("linking_token");
          sessionStorage.removeItem("gated_email");

          toast.success(`Welcome, ${result.fullName || trimmedFirst}!`);
          router.push("/dashboard");
        } else {
          toast.error(result?.message || "Registration failed");
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error("Registration failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const { data } = await completeRegistration({
        variables: {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          departmentId: departmentId || null,
          groupId: groupId || null,
        },
      });

      const result = data?.completeRegistration;

      if (result?.success) {
        // Update stored user name
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.fullName = result.member?.fullName || `${trimmedFirst} ${trimmedLast}`;
          localStorage.setItem("user", JSON.stringify(user));
        }

        toast.success(`Welcome, ${result.member?.fullName || trimmedFirst}!`);
        router.push("/dashboard");
      } else {
        toast.error(result?.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = options?.registrationDepartments || [];
  const groups = options?.registrationGroups || [];

  const hasToken = typeof window !== "undefined" && !!sessionStorage.getItem("registration_token");

  if (authLoading || (!isAuthenticated && !hasToken)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 font-bold text-lg">
            <div className="relative w-10 h-10">
              <img src="/logo.png" alt="SDA Church" className="object-contain w-full h-full" />
            </div>
            <span className="hidden sm:inline">SDA Kawangware</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold">Complete Registration</CardTitle>
              <CardDescription className="text-base">
                Tell us a bit about yourself to finish setting up your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    required
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Kamau"
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    required
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department (optional)</Label>
                  <Select
                    value={departmentId}
                    onValueChange={setDepartmentId}
                    disabled={isSubmitting || optionsLoading}
                  >
                    <SelectTrigger id="department" className="h-11">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Group (optional)</Label>
                  <Select
                    value={groupId}
                    onValueChange={setGroupId}
                    disabled={isSubmitting || optionsLoading}
                  >
                    <SelectTrigger id="group" className="h-11">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isSubmitting || firstName.trim().length < 2 || lastName.trim().length < 2}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Completing Registration...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
