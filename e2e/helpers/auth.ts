/**
 * Auth test helpers for Playwright E2E tests.
 *
 * Creates a fake JWT-shaped token and injects it into localStorage
 * + the has_session cookie so the app treats the browser as authenticated.
 *
 * Optionally intercepts the GraphQL `currentUserRole` query so that
 * admin-protected pages render without a real backend.
 *
 * These tokens are NOT valid JWTs — the backend is not involved.
 * Use these for testing UI rendering behind auth guards, not for
 * testing actual API calls.
 */

import { Page } from "@playwright/test";

type Role = "staff" | "category-admin" | "group-admin" | "content-admin" | "member";

interface SessionOptions {
  userId?: number;
  memberId?: number;
  phoneNumber?: string;
  fullName?: string;
  /** Token lifetime in seconds (default: 1 hour) */
  expiresIn?: number;
  /**
   * Role to mock via GraphQL interception.
   * - "staff": full admin access
   * - "category-admin": can see overview + contributions
   * - "content-admin": can manage content (announcements, devotionals, etc.)
   * - "member": regular member, no admin access (default)
   *
   * When set, the helper intercepts POST requests to the GraphQL endpoint
   * and returns a mocked `currentUserRole` response.
   */
  role?: Role;
}

/**
 * Build a fake JWT with a valid-looking payload.
 * The signature is garbage — this only needs to pass client-side
 * `JSON.parse(atob(token.split('.')[1]))` checks.
 */
function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa("fake-sig");
  return `${header}.${body}.${sig}`;
}

/**
 * Build a mock response for the `currentUserRole` GraphQL query.
 */
function buildRoleResponse(role: Role) {
  return {
    data: {
      currentUserRole: {
        isAuthenticated: true,
        isStaff: role === "staff",
        isCategoryAdmin: role === "category-admin",
        isGroupAdmin: role === "group-admin",
        isContentAdmin: role === "content-admin",
        adminCategoryIds: [],
        adminCategories: [],
        adminGroupNames: role === "group-admin" ? ["Youth"] : [],
      },
    },
  };
}

/**
 * Inject a fake authenticated session into the page.
 *
 * Sets the `has_session` cookie and uses `addInitScript` to populate
 * localStorage BEFORE React hydrates, ensuring the AuthProvider reads
 * valid tokens on the very first render.
 *
 * IMPORTANT: Call this BEFORE navigating to any page. The test's own
 * `page.goto()` should be the first navigation so that the init script
 * fires and React reads the tokens immediately.
 *
 * ```ts
 * await injectSession(page, { role: "staff" });
 * await page.goto('/admin', { waitUntil: "networkidle" });
 * ```
 */
export async function injectSession(
  page: Page,
  options: SessionOptions = {}
) {
  const {
    userId = 1,
    memberId = 1,
    phoneNumber = "254797030300",
    fullName = "Test User",
    expiresIn = 3600,
    role,
  } = options;

  const now = Math.floor(Date.now() / 1000);

  const accessToken = makeFakeJwt({
    user_id: userId,
    exp: now + expiresIn,
    iat: now,
  });

  const refreshToken = makeFakeJwt({
    user_id: userId,
    exp: now + 86400 * 7, // 7 days
    iat: now,
  });

  const user = JSON.stringify({ userId, memberId, phoneNumber, fullName });

  // If a role is specified, intercept GraphQL requests to mock the role query.
  // Use a regex to reliably match the GraphQL endpoint regardless of
  // trailing slashes or port variations (e.g. localhost:8000/graphql/).
  if (role) {
    const roleResponse = JSON.stringify(buildRoleResponse(role));
    await page.route(/\/graphql\/?$/, async (route, request) => {
      try {
        const postData = request.postDataJSON();
        if (
          postData &&
          typeof postData.query === "string" &&
          postData.query.includes("currentUserRole")
        ) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: roleResponse,
          });
          return;
        }

        if (
          role === "group-admin" &&
          postData &&
          typeof postData.query === "string" &&
          postData.query.includes("myGroupNames")
        ) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { myGroupNames: ["Youth"] } }),
          });
          return;
        }

        if (
          role === "group-admin" &&
          postData &&
          typeof postData.query === "string" &&
          postData.query.includes("groupContributions")
        ) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                groupContributions: [
                  {
                    id: "gc-1",
                    amount: "1000.00",
                    status: "completed",
                    transactionDate: new Date().toISOString(),
                    notes: "",
                    routedGroupName: "Youth",
                    purposeName: null,
                    member: {
                      id: "m-1",
                      fullName: "Youth Member",
                      phoneNumber: "254700000001",
                      memberNumber: "M-001",
                    },
                    category: {
                      id: "c-1",
                      name: "Offering",
                      code: "OFFER",
                    },
                    mpesaTransaction: null,
                  },
                ],
              },
            }),
          });
          return;
        }
      } catch {
        // postDataJSON() can throw if body isn't JSON
      }
      // For all other GraphQL queries, return empty data so they don't
      // hang waiting for a backend that may not be running.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null }),
      });
    });
  }

  // Set the session cookie that middleware checks (before any navigation)
  await page.context().addCookies([
    {
      name: "has_session",
      value: "1",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Use addInitScript to set localStorage BEFORE the page JS runs.
  // This ensures AuthProvider's getInitialAuthState() sees the tokens
  // on the very first render — no flash of unauthenticated state.
  await page.addInitScript(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", user);
    },
    { accessToken, refreshToken, user }
  );
}

/**
 * Clear the session — logout simulation.
 */
export async function clearSession(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  });

  await page.context().clearCookies();
}
