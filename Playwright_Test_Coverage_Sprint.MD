# Playwright Test Coverage Sprint

> **HISTORICAL — do not cite as current state.** This snapshot (8 test files, 42
> cases) predates the test-parity-audit program. As of Sprint D.5
> (2026-07-21/22), the suite has 269 specs across `e2e/*.spec.ts`, wired into
> CI via `.github/workflows/playwright.yml`, with a real verified baseline
> documented in `docs/e2e-baseline-2026-07-21.txt` and
> `docs/test-parity-audit/07_ADMIN_PARITY_SPRINT_PLAN_2026-07-21.md`. Kept here
> for historical reference only (FE-D.7).

## Current State
- 8 test files, 42 test cases
- 8 of 24 routes have any test coverage
- 0 authenticated-state tests (dashboard/admin pages only test auth redirect)
- 0 tests for public content pages (announcements, devotionals, events, sermons)
- 0 tests for any admin CRUD functionality
- Mobile viewport testing limited to hamburger menu only

## Coverage Map

| Page | Status | Gap |
|------|--------|-----|
| `/` | Good | — |
| `/login` | Good | — |
| `/verify-otp` | Partial | No OTP submission test |
| `/contribute` | Good | Full E2E payment flow covered |
| `/confirmation` | NONE | Payment result page untested |
| `/announcements` | NONE | Public content page |
| `/devotionals` | NONE | Public content page |
| `/events` | NONE | Public content page |
| `/sermons` | NONE | Public content page |
| `/dashboard` | Redirect only | No authenticated content tests |
| `/admin` | Redirect only | No overview content tests |
| `/admin/contributions` | Redirect only | No CRUD tests |
| `/admin/manual-entry` | NONE | — |
| `/admin/members` | Redirect only | No CRUD tests |
| `/admin/members/import` | NONE | — |
| `/admin/categories` | NONE | — |
| `/admin/category-admins` | NONE | — |
| `/admin/reports` | NONE | — |
| `/admin/c2b-transactions` | NONE | — |
| `/admin/content` | NONE | — |
| `/admin/announcements` | NONE | — |
| `/admin/devotionals` | NONE | — |
| `/admin/events` | NONE | — |
| `/admin/youtube` | NONE | — |

---

## Sprint 1: Test Infrastructure + Public Pages (3-4 days)

### 1.1 Create auth test helper
- Create `e2e/helpers/auth.ts` with `injectSession(page)` utility
- Sets localStorage tokens + `has_session` cookie to bypass login
- Allows testing authenticated pages without real OTP flow

### 1.2 Enable mobile viewport in playwright.config.ts
- Uncomment Mobile Chrome and Mobile Safari projects
- Add iPhone SE (320px) project for narrow screen testing

### 1.3 Delete redundant `example.spec.ts`
- Both tests already covered by `homepage.spec.ts`

### 1.4 Public content pages tests — `e2e/public-pages.spec.ts`
- `/announcements` — page loads, heading visible, announcement cards render or empty state
- `/devotionals` — page loads, heading visible, devotional cards render or empty state
- `/events` — page loads, heading visible, event cards render or empty state
- `/sermons` — page loads, heading visible, YouTube section renders
- Each page: navigation bar present, back-to-home link works

### 1.5 Confirmation page tests — `e2e/confirmation.spec.ts`
- `/confirmation` without params — shows error/redirect
- `/confirmation?id=xxx` — shows contribution details card
- Action buttons render (Make Another Contribution, Check Status)

---

## Sprint 2: Authenticated Dashboard + Mobile Nav (3-4 days)

### 2.1 Dashboard authenticated tests — `e2e/dashboard-authenticated.spec.ts`
- Inject session via helper
- Summary cards render (Total Contributions, This Month, Status)
- Contribution history table/card view loads
- Header buttons visible (Admin Panel if staff, Make Contribution, Logout)
- Logout button clears session and redirects to login

### 2.2 Bottom nav tests — `e2e/mobile-navigation.spec.ts`
- Mobile viewport: bottom nav visible on `/`, `/contribute`, `/events`
- Bottom nav hidden on desktop viewport
- Bottom nav links navigate correctly (Home, Give, Events, Sermons)
- "More" menu opens and shows additional links
- Admin bottom nav visible on admin pages (mobile viewport)
- Admin bottom nav hidden on desktop

### 2.3 Responsive table tests — `e2e/responsive-tables.spec.ts`
- Mobile viewport: card view visible, table hidden on dashboard contribution history
- Desktop viewport: table visible, card view hidden
- Card view shows key data (amount, status, category)

---

## Sprint 3: Admin Page Structure Tests (4-5 days)

### 3.1 Admin overview — `e2e/admin-overview.spec.ts`
- Inject staff session
- Stats cards render (Total Contributions, Today, Members, Categories)
- Recent contributions table/cards load
- Member stats section visible

### 3.2 Admin contributions — `e2e/admin-contributions.spec.ts`
- Page header and stats cards render
- Filters section visible (status, date range)
- Contributions table/cards load with data or empty state
- "Manual Entry" button links to correct page
- Manual entry page: form fields render (member lookup, category, amount)

### 3.3 Admin members — `e2e/admin-members.spec.ts`
- Stats cards render
- Search/filter section visible
- Members table/cards load
- Pagination controls visible
- "Import Members" button links to import page
- Import page: file upload area and instructions visible

### 3.4 Admin categories — `e2e/admin-categories.spec.ts`
- Category list renders as cards
- Create category form visible
- Category card shows name, code, status

### 3.5 Admin content pages — `e2e/admin-content.spec.ts`
- Content hub page shows card grid (Announcements, Devotionals, Events, YouTube)
- Each content admin page: header renders, create button visible, list/cards load
- Covers: `/admin/announcements`, `/admin/devotionals`, `/admin/events`, `/admin/youtube`

### 3.6 Admin reports — `e2e/admin-reports.spec.ts`
- Report form renders (date selectors, category checkboxes)
- Quick report cards visible
- Generate button present

### 3.7 Admin C2B transactions — `e2e/admin-c2b.spec.ts`
- Stats cards render
- Filter section visible
- Transactions table/cards load or empty state
- Unmatched alert banner visible when applicable

---

## Sprint 4: Role-Based Access + Error States (2-3 days)

### 4.1 Role-based access tests — `e2e/role-access.spec.ts`
- Staff session: can access all admin pages
- Category admin session: can access overview + contributions, blocked from members/reports
- Content admin session: can access content pages, blocked from members/reports
- Non-admin member: redirected to dashboard from `/admin`

### 4.2 Error state tests — `e2e/error-states.spec.ts`
- Expired token: redirects to login
- Network error on GraphQL: shows error message gracefully
- Empty states: pages with no data show appropriate empty state messages

---

## Total Estimate
| Sprint | Focus | Days |
|--------|-------|------|
| Sprint 1 | Infrastructure + Public Pages | 3-4 |
| Sprint 2 | Dashboard + Mobile Nav | 3-4 |
| Sprint 3 | Admin Page Structure | 4-5 |
| Sprint 4 | Role Access + Errors | 2-3 |
| **Total** | | **12-16 days** |

## Expected Outcome
- Route coverage: 8/24 → 24/24 (100%)
- Test cases: 42 → ~120+
- Mobile viewport testing enabled
- Auth helper enables all authenticated page tests
- Every page has at minimum: loads, heading visible, key elements render
