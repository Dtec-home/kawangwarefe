/**
 * Post-login landing page (T2.4 / RR-4).
 *
 * An explicit `redirect` target always wins. Otherwise a pure recorder
 * (recorder role, not staff) lands on `/record`, a pure clerk (clerk role and
 * nothing else that opens the admin area, R4) on `/admin/department-reports`,
 * everyone else on `/dashboard`.
 *
 * Uses a plain fetch (like the token refresh in auth-context) so it works
 * straight after `login()` stores the token, without depending on the Apollo
 * cache — which may still hold the previous, anonymous role answer. Any
 * failure falls back to `/dashboard`; route guards still confine recorders.
 */

export const DEFAULT_LANDING = "/dashboard";
export const RECORDER_LANDING = "/record";
export const CLERK_LANDING = "/admin/department-reports";

const ROLE_QUERY = `query PostLoginRole { currentUserRole { isStaff isRecorder isClerk isCategoryAdmin ledDepartmentIds } }`;
const TIMEOUT_MS = 5000;

type Landing = "recorder" | "clerk" | null;

async function fetchLanding(): Promise<Landing> {
  if (typeof window === "undefined") return null;

  let token: string | null = null;
  try {
    token = localStorage.getItem("access_token");
  } catch {
    return null;
  }
  if (!token) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: ROLE_QUERY }),
        signal: controller.signal,
      }
    );
    const json = await response.json();
    const role = json?.data?.currentUserRole;
    if (!role || role.isStaff) return null;
    if (role.isRecorder) return "recorder";
    const leads = !!role.isCategoryAdmin || (role.ledDepartmentIds?.length ?? 0) > 0;
    if (role.isClerk && !leads) return "clerk";
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** True when the signed-in user is a recorder and not staff (RR-4). */
export async function fetchIsPureRecorder(): Promise<boolean> {
  return (await fetchLanding()) === "recorder";
}

export async function resolvePostLoginRedirect(explicitRedirect: string | null | undefined): Promise<string> {
  if (explicitRedirect) return explicitRedirect;
  const landing = await fetchLanding();
  if (landing === "recorder") return RECORDER_LANDING;
  if (landing === "clerk") return CLERK_LANDING;
  return DEFAULT_LANDING;
}

/** Where the middleware sends signed-in visitors of /login and /verify-otp. */
export const POST_LOGIN_PATH = "/post-login";

const AUTH_ROUTES = ["/login", "/verify-otp", POST_LOGIN_PATH];

/**
 * A same-origin path that is safe to redirect to, or null. Rejects absolute
 * and protocol-relative URLs (open redirects) and the auth routes themselves
 * (redirect loops).
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  const pathname = value.split(/[?#]/)[0];
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;
  return value;
}
