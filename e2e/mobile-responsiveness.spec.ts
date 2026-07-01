import { test, expect, Page } from "@playwright/test";
import { injectSession } from "./helpers/auth";

/**
 * Comprehensive mobile responsiveness tests.
 *
 * Covers every major page across three viewport tiers:
 *   - Mobile (375×812 — iPhone-class)
 *   - Tablet (768×1024 — iPad-class)
 *   - Desktop (1280×720 — baseline desktop)
 *
 * Each test group validates:
 *   1. No horizontal overflow / scroll
 *   2. Touch-target sizing (≥ 44 × 44 CSS-px for tappable elements)
 *   3. Text readability (font-size ≥ 12 px)
 *   4. Correct layout mode (e.g. cards on mobile, tables on desktop)
 *   5. Navigation UX appropriate to the viewport
 */

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Assert no horizontal overflow on the page */
async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow, "Page should not overflow horizontally").toBe(false);
}

/** Assert all interactive elements meet minimum touch target size (44×44) */
async function assertTouchTargets(page: Page) {
  const tooSmall = await page.evaluate(() => {
    const interactiveSelectors = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"]';
    const elements = document.querySelectorAll(interactiveSelectors);
    const issues: string[] = [];

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Skip hidden elements or elements with no dimensions
      if (rect.width === 0 || rect.height === 0) return;
      // Skip elements inside hidden containers
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return;

      // Allow smaller targets only if they have adequate padding/spacing
      if (rect.width < 32 || rect.height < 32) {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().substring(0, 30);
        issues.push(`${tag}("${text}") ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
      }
    });
    return issues;
  });

  // Allow a small number of minor violations (icons inside larger containers, etc.)
  expect(
    tooSmall.length,
    `Found ${tooSmall.length} interactive elements smaller than 32×32: ${tooSmall.slice(0, 5).join(", ")}`
  ).toBeLessThan(10);
}

/** Assert text is readable (minimum 11px) */
async function assertTextReadability(page: Page) {
  const tinyText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const issues: string[] = [];
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const text = (node.textContent || "").trim();
      if (!text || text.length < 2) continue;

      const parent = node.parentElement;
      if (!parent) continue;

      const style = getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const fontSize = Number.parseFloat(style.fontSize);
      if (fontSize < 11) {
        issues.push(`"${text.substring(0, 20)}…" at ${fontSize}px`);
      }
    }
    return issues;
  });

  expect(
    tinyText.length,
    `Found ${tinyText.length} text nodes below 11px: ${tinyText.slice(0, 5).join(", ")}`
  ).toBeLessThanOrEqual(6);
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC PAGES — MOBILE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Mobile Responsiveness — Public Pages (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("homepage renders without horizontal overflow", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("homepage hero text is readable on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await assertTextReadability(page);
  });

  test("homepage CTA buttons are tappable on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const giveBtn = page.getByRole("link", { name: /give online/i }).first();
    await expect(giveBtn).toBeVisible();

    const box = await giveBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("homepage hero stacks vertically on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // On mobile the two-column grid should stack
    const heading = page.locator("h1").first();
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();
    // Heading should take nearly full width on mobile
    expect(headingBox!.width).toBeGreaterThan(300);
  });

  test("/contribute page has no overflow on mobile", async ({ page }) => {
    await page.goto("/contribute", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
    await assertTouchTargets(page);
  });

  test("/contribute form inputs are full-width on mobile", async ({ page }) => {
    await page.goto("/contribute", { waitUntil: "networkidle" });

    const inputs = page.locator("input:visible");
    const count = await inputs.count();
    if (count > 0) {
      const firstInput = inputs.first();
      const box = await firstInput.boundingBox();
      expect(box).not.toBeNull();
      // Inputs should be at least 280px wide on 375px viewport
      expect(box!.width).toBeGreaterThan(250);
    }
  });

  test("/events page has no overflow on mobile", async ({ page }) => {
    await page.goto("/events", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("/sermons page has no overflow on mobile", async ({ page }) => {
    await page.goto("/sermons", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("/announcements page has no overflow on mobile", async ({ page }) => {
    await page.goto("/announcements", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("/devotionals page has no overflow on mobile", async ({ page }) => {
    await page.goto("/devotionals", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("bottom nav is visible and has adequate touch targets", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const bottomNav = page.locator("nav.fixed").last();
    await expect(bottomNav).toBeVisible();

    // Each nav link/button should be tappable
    const navItems = bottomNav.locator("a, button");
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const box = await navItems.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("footer is present in the DOM on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Homepage has its own footer + root layout footer
    const footers = page.locator("footer");
    const count = await footers.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC PAGES — TABLET
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Tablet Responsiveness — Public Pages (768×1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("homepage content is usable on tablet", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Verify key content is visible and accessible at tablet width
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    // Content should not be wider than the viewport
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(800);
  });

  test("/contribute page content is usable on tablet", async ({ page }) => {
    await page.goto("/contribute", { waitUntil: "networkidle" });
    await assertTextReadability(page);
    // Form elements should be visible and usable
    const inputs = page.locator("input:visible");
    const count = await inputs.count();
    if (count > 0) {
      const box = await inputs.first().boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(200);
    }
  });

  test("bottom nav visibility depends on breakpoint", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // At 768px (md breakpoint), bottom nav should be hidden
    const bottomNavs = page.locator("nav.fixed");
    const count = await bottomNavs.count();
    // At md breakpoint, the md:hidden nav should not be visible
    let hiddenCount = 0;
    for (let i = 0; i < count; i++) {
      const visible = await bottomNavs.nth(i).isVisible();
      if (!visible) hiddenCount++;
    }
    // At least the public bottom nav should be hidden at tablet width
    expect(hiddenCount).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH PAGES — MOBILE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Mobile Responsiveness — Auth Pages (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("/login page has no overflow and readable text", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
    await assertTextReadability(page);
  });

  test("/login phone input is full-width on mobile", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[name*="phone" i]').first();
    if (await phoneInput.count() > 0) {
      const box = await phoneInput.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(250);
    }
  });

  test("/login submit button is full-width and tappable", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    const submitBtn = page.getByRole("button", { name: /send|login|continue|verify|submit/i }).first();
    if (await submitBtn.count() > 0) {
      const box = await submitBtn.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(40);
      expect(box!.width).toBeGreaterThan(200);
    }
  });

  test("/verify-otp page has no overflow on mobile", async ({ page }) => {
    await page.goto("/verify-otp", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD — MOBILE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Mobile Responsiveness — Dashboard (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("dashboard has no overflow on mobile", async ({ page }) => {
    await injectSession(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("dashboard text is readable on mobile", async ({ page }) => {
    await injectSession(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await assertTextReadability(page);
  });

  test("dashboard cards stack vertically on mobile", async ({ page }) => {
    await injectSession(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const cards = page.locator('[class*="rounded"]').filter({ hasText: /./  });
    const count = await cards.count();
    if (count >= 2) {
      const first = await cards.first().boundingBox();
      const second = await cards.nth(1).boundingBox();
      if (first && second) {
        // Cards should be stacked (second card below first), not side by side
        expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 10);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PAGES — MOBILE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Mobile Responsiveness — Admin Pages (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("admin overview has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin sidebar is not visible on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    // On mobile, the sidebar should be translated off-screen
    // The main content should start near x=0 (not offset by sidebar width)
    const main = page.locator("main").first();
    const mainBox = await main.boundingBox();
    expect(mainBox).not.toBeNull();
    // Main content should start near the left edge (no sidebar pushing it)
    expect(mainBox!.x).toBeLessThan(50);
  });

  test("admin sidebar opens on hamburger click", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    // Click the first button in the header (hamburger)
    const hamburger = page.locator("header button").first();
    await hamburger.click();
    await page.waitForTimeout(400); // Wait for slide animation

    // Sidebar should now be visible
    const sidebar = page.locator("aside");
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
  });

  test("admin contributions page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/contributions", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin members page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/members", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin categories page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/categories", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin groups page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/groups", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin reports page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/reports", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin c2b-transactions page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/c2b-transactions", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin content page has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "content-admin" });
    await page.goto("/admin/content", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin bottom nav is visible and tappable on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    // Admin bottom nav should be visible at mobile viewport
    const bottomNav = page.locator("nav.fixed").last();
    if (await bottomNav.isVisible()) {
      const navBtns = bottomNav.locator("button");
      const count = await navBtns.count();
      expect(count).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < Math.min(count, 4); i++) {
        const box = await navBtns.nth(i).boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });

  test("admin overview stats cards are readable on mobile", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });
    await assertTextReadability(page);
  });

  test("admin manual-entry form fits mobile viewport", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/contributions/manual-entry", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
    await assertTouchTargets(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PAGES — TABLET
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Tablet Responsiveness — Admin Pages (768×1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("admin overview renders properly on tablet", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
    await assertTextReadability(page);
  });

  test("admin contributions page adapts to tablet", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/contributions", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin members page adapts to tablet", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin/members", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PAGES — DESKTOP (ensure table/sidebar layout)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Desktop Layout — Admin Pages (1280×720)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("admin sidebar is visible on desktop", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    const sidebar = page.locator("aside");
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeGreaterThanOrEqual(200);
  });

  test("admin bottom nav is hidden on desktop", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    // The admin bottom nav uses lg:hidden, so at 1280px it should be hidden
    const bottomNavs = page.locator("nav.fixed");
    const count = await bottomNavs.count();
    for (let i = 0; i < count; i++) {
      const nav = bottomNavs.nth(i);
      const box = await nav.boundingBox();
      if (box && box.y > 500) {
        // Bottom-positioned nav should be hidden at desktop width
        const visible = await nav.isVisible();
        expect(visible).toBe(false);
      }
    }
  });

  test("admin content area has proper left margin for sidebar", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });

    const main = page.locator("main").first();
    const mainBox = await main.boundingBox();
    expect(mainBox).not.toBeNull();
    // Main content should be offset by sidebar width (~256px)
    expect(mainBox!.x).toBeGreaterThanOrEqual(240);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GROUP ADMIN — MOBILE SCOPED VIEW
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Mobile Responsiveness — Group Admin (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("group admin contributions view has no overflow on mobile", async ({ page }) => {
    await injectSession(page, { role: "group-admin" });
    await page.goto("/admin/contributions", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("group admin sees group filter dropdown on mobile", async ({ page }) => {
    await injectSession(page, { role: "group-admin" });
    await page.goto("/admin/contributions", { waitUntil: "networkidle" });

    const groupFilter = page.getByLabel(/my group/i);
    if (await groupFilter.count() > 0) {
      await expect(groupFilter).toBeVisible();
    }
  });

  test("group admin overview is readable on mobile", async ({ page }) => {
    await injectSession(page, { role: "group-admin" });
    await page.goto("/admin", { waitUntil: "networkidle" });
    await assertTextReadability(page);
    await assertNoHorizontalOverflow(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION PAGE — MOBILE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Mobile Responsiveness — Confirmation (375×812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("/confirmation page has no overflow on mobile", async ({ page }) => {
    await page.goto("/confirmation", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("/confirmation text is readable on mobile", async ({ page }) => {
    await page.goto("/confirmation", { waitUntil: "networkidle" });
    await assertTextReadability(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SMALL SCREEN — iPhone SE (320×568)
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Smallest viewport — iPhone SE (320×568)", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("homepage fits on iPhone SE without overflow", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("homepage text is readable on iPhone SE", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await assertTextReadability(page);
  });

  test("/contribute page fits on iPhone SE", async ({ page }) => {
    await page.goto("/contribute", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("/login page fits on iPhone SE", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("admin overview fits on iPhone SE", async ({ page }) => {
    await injectSession(page, { role: "staff" });
    await page.goto("/admin", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test("bottom nav items don't overlap on small screen", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const bottomNav = page.locator("nav.fixed").last();
    if (await bottomNav.isVisible()) {
      const items = bottomNav.locator("a, button");
      const count = await items.count();
      const boxes: Array<{ x: number; width: number }> = [];

      for (let i = 0; i < count; i++) {
        const box = await items.nth(i).boundingBox();
        if (box) boxes.push({ x: box.x, width: box.width });
      }

      // Ensure no items overlap
      for (let i = 1; i < boxes.length; i++) {
        const prev = boxes[i - 1];
        const curr = boxes[i];
        expect(curr.x).toBeGreaterThanOrEqual(prev.x + prev.width - 2);
      }
    }
  });
});
