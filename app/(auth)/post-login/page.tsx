/**
 * Post-login landing route (T5.3).
 *
 * The middleware cannot see roles, so it sends signed-in visitors of /login
 * and /verify-otp here. This page picks the landing page the same way a fresh
 * login does: an explicit (safe) `redirect` wins, pure recorders go to
 * /record, everyone else to /dashboard.
 */

"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { resolvePostLoginRedirect, safeRedirectPath } from "@/lib/auth/post-login-redirect";

function PostLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const redirect = safeRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // A stale session cookie would bounce /login straight back here.
      document.cookie = "has_session=; path=/; max-age=0; SameSite=Lax";
      router.replace(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
      return;
    }
    let cancelled = false;
    resolvePostLoginRedirect(redirect).then((target) => {
      if (!cancelled) router.replace(target);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, redirect, router]);

  return <PostLoginSpinner />;
}

function PostLoginSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="sr-only">Signing you in…</span>
    </div>
  );
}

export default function PostLoginPage() {
  return (
    <Suspense fallback={<PostLoginSpinner />}>
      <PostLoginContent />
    </Suspense>
  );
}
