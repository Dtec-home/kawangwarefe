/**
 * Next.js Middleware — Server-side route protection
 *
 * Since JWTs are stored in localStorage (not cookies), this middleware
 * cannot validate the token itself. Instead it works as a lightweight
 * guard that checks for a "has_session" cookie set by the client after
 * login. If the cookie is missing on a protected route, the user is
 * redirected to /login before any page JS loads.
 *
 * The real security enforcement remains on the backend (GraphQL resolvers
 * check JWT validity). This middleware only improves UX by avoiding the
 * flash-of-content on protected pages for clearly-unauthenticated users.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/admin"];

// Routes that authenticated users shouldn't see (redirect to dashboard)
const AUTH_PATHS = ["/login", "/verify-otp"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get("has_session")?.value === "1";

  // Protected routes — redirect to login if no session cookie
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth routes — redirect to dashboard if already has session
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/verify-otp"],
};
