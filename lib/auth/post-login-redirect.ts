/**
 * Post-login landing page (T2.4 / RR-4).
 *
 * An explicit `redirect` target always wins. Otherwise a pure recorder
 * (recorder role, not staff) lands on `/record`; everyone else on `/dashboard`.
 *
 * Uses a plain fetch (like the token refresh in auth-context) so it works
 * straight after `login()` stores the token, without depending on the Apollo
 * cache — which may still hold the previous, anonymous role answer. Any
 * failure falls back to `/dashboard`; route guards still confine recorders.
 */

export const DEFAULT_LANDING = "/dashboard";
export const RECORDER_LANDING = "/record";

const ROLE_QUERY = `query PostLoginRole { currentUserRole { isStaff isRecorder } }`;
const TIMEOUT_MS = 5000;

export async function fetchIsPureRecorder(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  let token: string | null = null;
  try {
    token = localStorage.getItem("access_token");
  } catch {
    return false;
  }
  if (!token) return false;

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
    return !!role?.isRecorder && !role?.isStaff;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolvePostLoginRedirect(explicitRedirect: string | null | undefined): Promise<string> {
  if (explicitRedirect) return explicitRedirect;
  return (await fetchIsPureRecorder()) ? RECORDER_LANDING : DEFAULT_LANDING;
}
