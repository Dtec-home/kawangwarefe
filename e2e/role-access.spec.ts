import { test, expect } from "@playwright/test";
import { injectSession, clearSession } from "./helpers/auth";
import { fakeDepartmentReports } from "./helpers/department-reports-staff";
import { fakeWhatsAppPosts } from "./helpers/whatsapp-posts";
import { fakeFundTransfers } from "./helpers/fund-transfers";

/**
 * Role-based access tests.
 *
 * Verifies that admin pages redirect unauthorized users
 * and that different roles see appropriate content.
 */

test.describe("Unauthenticated Access -- Redirect to Login", () => {
  test("visiting /dashboard without session redirects to /login", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    // Should redirect to login (middleware checks has_session cookie)
    expect(page.url()).toMatch(/\/(login|$)/);
  });

  test("visiting /admin without session redirects to /login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/(login|$)/);
  });

  test("visiting /admin/contributions without session redirects", async ({ page }) => {
    await page.goto("/admin/contributions", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/(login|$)/);
  });

  test("visiting /admin/members without session redirects", async ({ page }) => {
    await page.goto("/admin/members", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/(login|$)/);
  });
});

test.describe("Staff Role -- Full Access", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "staff" });
  });

  test("can access admin overview", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    // Staff should see admin content, not be redirected
    const hasOverview = await page.getByText(/dashboard overview/i).count();
    const hasLoading = await page.getByText(/loading/i).count();
    expect(hasOverview > 0 || hasLoading > 0 || page.url().includes("/admin")).toBeTruthy();
  });

  test("can access members page", async ({ page }) => {
    await page.goto("/admin/members", { waitUntil: "networkidle" });
    const hasMembers = await page.getByRole("heading", { name: /members/i }).count();
    const hasLoading = await page.getByText(/loading/i).count();
    expect(hasMembers > 0 || hasLoading > 0 || page.url().includes("/admin/members")).toBeTruthy();
  });

  test("can access reports page", async ({ page }) => {
    await page.goto("/admin/reports", { waitUntil: "networkidle" });
    const hasReports = await page.getByRole("heading", { name: /report/i }).count();
    const hasLoading = await page.getByText(/loading/i).count();
    expect(hasReports > 0 || hasLoading > 0 || page.url().includes("/admin/reports")).toBeTruthy();
  });

  test("can access category admins page", async ({ page }) => {
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
    const hasCatAdmins = await page.getByRole("heading", { name: /category admins/i }).count();
    const hasLoading = await page.getByText(/loading/i).count();
    expect(hasCatAdmins > 0 || hasLoading > 0 || page.url().includes("/admin/category-admins")).toBeTruthy();
  });
});

test.describe("Content Admin Role -- Content Access Only", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "content-admin" });
  });

  test("can access announcements page", async ({ page }) => {
    await page.goto("/admin/announcements", { waitUntil: "networkidle" });
    const hasAnnouncements = await page.getByRole("heading", { name: /announcements/i }).count();
    const hasLoading = await page.getByText(/loading/i).count();
    expect(
      hasAnnouncements > 0 || hasLoading > 0 || page.url().includes("/admin/announcements")
    ).toBeTruthy();
  });

  test("cannot access members page (redirects or shows blank)", async ({ page }) => {
    await page.goto("/admin/members", { waitUntil: "networkidle" });
    // Content admin should be redirected away from staff-only pages.
    // AdminProtectedRoute renders null while redirect is pending,
    // so we accept: redirected URL, loading state, OR blank page (no members heading).
    const hasMembersHeading = await page.getByRole("heading", { name: /members/i }).count();
    expect(hasMembersHeading).toBe(0);
  });
});

test.describe("Category Admin Role -- Limited Access", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, { role: "category-admin" });
  });

  test("can access admin overview", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "networkidle" });
    // Category admin can access overview
    const hasContent = await page.getByText(/dashboard|overview|loading/i).count();
    expect(hasContent > 0 || page.url().includes("/admin")).toBeTruthy();
  });

  test("cannot access category-admins management page", async ({ page }) => {
    await page.goto("/admin/category-admins", { waitUntil: "networkidle" });
    // Category admin lacks staff access — AdminProtectedRoute renders null
    // while redirect is pending. Verify the page content is NOT shown.
    const hasCatAdminsHeading = await page.getByRole("heading", { name: /category admins/i }).count();
    expect(hasCatAdminsHeading).toBe(0);
  });
});

test.describe("Department reports staff pages -- members and recorders kept out (DR-8)", () => {
  const pages = ["/admin/department-reports/periods", "/admin/department-reports/period/1"];
  for (const persona of ["member", "recorder"] as const) {
    for (const path of pages) {
      test(`${persona} cannot reach ${path}`, async ({ page }) => {
        test.setTimeout(60_000);
        await fakeDepartmentReports(page, { persona });
        await page.goto(path, { waitUntil: "networkidle" });
        // AdminProtectedRoute sends members to /dashboard and pure recorders to /record;
        // it renders null while that redirect is pending (the target may still be compiling).
        await page.waitForURL(persona === "recorder" ? /\/record/ : /\/dashboard/, { timeout: 20_000 }).catch(() => {});
        // Still here? Then the guard must have decided (no spinner) and show none of the page.
        if (page.url().includes(path)) await expect(page.getByText("Loading...")).toHaveCount(0);
        expect(await page.getByRole("heading", { name: /Reporting periods|Department reports/ }).count()).toBe(0);
        expect(await page.getByTestId("dept-report-tracker-row").count()).toBe(0);
      });
    }
  }
});

test.describe("Fund transfers -- members and recorders kept out (FT-2)", () => {
  for (const persona of ["member", "recorder"] as const) {
    test(`${persona} cannot reach /admin/transfers`, async ({ page }) => {
      test.setTimeout(60_000);
      const state = await fakeFundTransfers(page, { persona });
      await page.goto("/admin/transfers", { waitUntil: "networkidle" });
      await page.waitForURL(persona === "recorder" ? /\/record/ : /\/dashboard/, { timeout: 20_000 }).catch(() => {});
      if (page.url().includes("/admin/transfers")) await expect(page.getByText("Loading...")).toHaveCount(0);
      expect(await page.getByRole("heading", { name: "Fund transfers" }).count()).toBe(0);
      expect(await page.getByTestId("fund-transfer-row").count()).toBe(0);
      expect(state.calls.some((c) => c.op === "GetFundTransfers")).toBe(false);
    });
  }
});

test.describe("WhatsApp posts settings -- admins only (WA-3)", () => {
  for (const persona of ["member", "recorder"] as const) {
    test(`${persona} cannot reach /admin/whatsapp-posts`, async ({ page }) => {
      test.setTimeout(60_000);
      await fakeWhatsAppPosts(page, { persona });
      await page.goto("/admin/whatsapp-posts", { waitUntil: "networkidle" });
      // AdminProtectedRoute sends members to /dashboard and pure recorders to /record.
      await page.waitForURL(persona === "recorder" ? /\/record/ : /\/dashboard/, { timeout: 20_000 }).catch(() => {});
      if (page.url().includes("/admin/whatsapp-posts")) await expect(page.getByText("Loading...")).toHaveCount(0);
      expect(await page.getByTestId("schedule-summary").count()).toBe(0);
      expect(await page.getByRole("list", { name: "Post layout" }).count()).toBe(0);
    });
  }

  test("a treasurer (staff, not admin) sees no settings", async ({ page }) => {
    test.setTimeout(60_000);
    await fakeWhatsAppPosts(page, { persona: "treasurer" });
    await page.goto("/admin/whatsapp-posts", { waitUntil: "networkidle" });
    await expect(page.getByText("Only admins change the WhatsApp posts")).toBeVisible({ timeout: 20_000 });
    expect(await page.getByTestId("schedule-summary").count()).toBe(0);
  });
});

test.describe("Session Expiry", () => {
  test("visiting dashboard without any session redirects to login", async ({ page }) => {
    // Do NOT inject a session — navigate directly to a protected route
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Middleware checks has_session cookie → should redirect to /login
    expect(page.url()).toContain("/login");
  });

  test("expired token does not show protected content", async ({ page }) => {
    // Set cookie so middleware allows through, but use an expired token
    // so the auth context rejects it
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

    // Create already-expired JWTs
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const expiredBody = btoa(JSON.stringify({ user_id: 1, exp: now - 3600, iat: now - 7200 }));
    const expiredToken = `${header}.${expiredBody}.${btoa("fake")}`;

    await page.addInitScript(
      ({ token }) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", token); // also expired
        localStorage.setItem("user", JSON.stringify({ userId: 1, memberId: 1, phoneNumber: "254700000000", fullName: "Expired" }));
      },
      { token: expiredToken }
    );

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Auth context sees expired token → either redirects to login or
    // shows loading/blank (ProtectedRoute renders null during redirect).
    // The dashboard content should NOT be visible.
    const hasDashboardContent = await page.getByRole("heading", { name: /my dashboard|dashboard/i }).count();
    const isOnLogin = page.url().includes("/login");
    expect(hasDashboardContent === 0 || isOnLogin).toBeTruthy();
  });
});
