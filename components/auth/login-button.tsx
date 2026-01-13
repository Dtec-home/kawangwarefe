/**
 * Reusable Login Button Component
 * Follows DRY and SOLID principles
 *
 * Single Responsibility: Handles navigation to login page
 * Open/Closed: Extensible via props without modification
 * Dependency Inversion: Depends on useAuth abstraction
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface LoginButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
  showWhenAuthenticated?: boolean;
}

export function LoginButton({
  variant = "outline",
  size = "default",
  className = "",
  children,
  showWhenAuthenticated = false,
}: LoginButtonProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Don't show if authenticated (unless explicitly requested)
  if (!showWhenAuthenticated && isAuthenticated) {
    return null;
  }

  // Don't show while loading auth state
  if (isLoading) {
    return null;
  }

  const handleClick = () => {
    router.push("/login");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <LogIn className="h-4 w-4 mr-2" />
      {children || "Login"}
    </Button>
  );
}
