# Test Coverage Sprint 2 — Gap Closure

**Date:** 2026-03-18  
**Based on:** STLC audit of current state

---

## Current State (Post Sprint 1)

| Metric | Before Sprint 1 | Now |
|--------|----------------|-----|
| E2E spec files | 8 | 23 |
| E2E test cases | ~42 | ~230 |
| Route coverage | 8/24 | 21/24 |
| Unit test files | 0 | 12 |
| Unit test cases | 0 | ~120 |
| CI pipeline | disabled | disabled |

---

## Remaining Gaps

### Routes with no E2E coverage
| Route | Gap |
|-------|-----|
| `/admin/manual-entry` | No tests at all |
| `/admin/members/import` | No tests at all |
| `/admin/category-admins` | No tests at all |

### Components with no unit tests
| Component | Risk |
|-----------|------|
| `ContributionForm` | High — complex multi-step form, payment trigger |
| `ContributionSummary` | Medium — displays payment data |
| `LoginPage` | Medium — OTP request entry point |
| `VerifyOTPPage` | Medium — OTP submission |
| `ConfirmationPage` | Medium — payment result display |
| `DashboardPage` | Low — mostly data display |
| `AdminLayout` | Low — nav/sidebar structure |

### Infrastructure gaps
| Gap | Impact |
|-----|--------|
| CI workflows disabled (`.yml.disabled`) | Tests never run automatically |
| No defect tracking process | Bugs found in testing have no formal log |
| `mock-interview-*.spec.ts` — 2 debug specs in e2e folder | Noise in test suite |

---

## Sprint 5: Missing Routes (2 days)

### 5.1 Admin manual entry — `e2e/admin-contributions.spec.ts` (extend existing)
- Navigate to `/admin/contributions/manual-entry` via the Manual Entry button
- Form renders: member phone lookup field, category selector, amount input
- Submit with empty fields shows validation errors
- Submit with valid data triggers confirmation or success state

### 5.2 Admin members import — `e2e/admin-members.spec.ts` (extend existing)
- Navigate to `/admin/members/import` via Import Members button
- File upload area visible with accepted format instructions (CSV)
- Upload a valid CSV file — progress/success state renders
- Upload an invalid file type — error message renders

### 5.3 Admin category-admins — new `e2e/admin-category-admins.spec.ts`
- Inject staff session, navigate to `/admin/category-admins`
- Page heading visible
- Category admin list renders or shows empty state
- Assign/remove category admin controls visible

---

## Sprint 6: Unit Tests for High-Risk Components (3 days)

### 6.1 `ContributionForm` — `__tests__/components/forms/contribution-form.test.tsx`
- Renders step 1 (phone + category selection) correctly
- Phone input validation — rejects invalid formats
- Category selector shows loaded categories
- Amount input rejects non-numeric and zero values
- "Next" button disabled until required fields are valid
- Renders step 2 (summary/confirm) after valid step 1
- Submit triggers `initiatePayment` mutation
- Shows loading state during submission
- Shows error message on mutation failure

### 6.2 `ContributionSummary` — `__tests__/components/forms/contribution-summary.test.tsx`
- Renders phone number, category name, and amount
- Renders total correctly for multi-category contributions
- "Edit" button calls onEdit callback
- "Confirm & Pay" button calls onConfirm callback

### 6.3 `LoginPage` — `__tests__/components/auth/login-page.test.tsx`
- Renders phone input and submit button
- Submit with empty phone shows validation error
- Submit with valid phone calls `requestOtp` mutation
- Shows loading state during mutation
- On success, navigates to `/verify-otp`
- On error, shows error message

### 6.4 `VerifyOTPPage` — `__tests__/components/auth/verify-otp-page.test.tsx`
- Renders OTP input and verify button
- Submit with empty OTP shows validation error
- Submit with valid OTP calls `verifyOtp` mutation
- On success, stores token and navigates to `/dashboard`
- On error, shows "Invalid OTP" message
- Resend OTP button calls `requestOtp` again

---

## Sprint 7: CI Pipeline Re-enablement (1 day)

### 7.1 Re-enable and fix frontend-tests workflow
- Rename `.github/workflows/frontend-tests.yml.disabled` → `frontend-tests.yml`
- Verify `npm run test -- --run` passes in CI environment
- Add coverage threshold gate (fail if < 70% line coverage)

### 7.2 Re-enable and fix Playwright workflow
- Rename `.github/workflows/playwright.yml.disabled` → `playwright.yml`
- Scope to Chromium only in CI (Firefox/WebKit remain for local)
- Upload `playwright-report/` as artifact on failure

### 7.3 Clean up debug specs
- Delete `e2e/mock-interview-race-condition.spec.ts`
- Delete `e2e/mock-interview-live-callback.spec.ts`
- These are investigation artifacts, not regression tests

---

## Sprint 8: Defect Tracking Setup (0.5 days)

### 8.1 Add GitHub issue templates
- `bug_report.md` — steps to reproduce, expected vs actual, browser/viewport
- `test_gap.md` — route/component, missing scenario, risk level

### 8.2 Add test failure triage note to TESTING.md
- Document process: CI fails → open bug issue → link to failing spec → fix or skip with reason

---

## Updated Coverage Map

| Route | After Sprint 5 |
|-------|---------------|
| `/admin/manual-entry` | ✅ |
| `/admin/members/import` | ✅ |
| `/admin/category-admins` | ✅ |
| All others | Already covered |

---

## Total Estimate

| Sprint | Focus | Days |
|--------|-------|------|
| Sprint 5 | Missing 3 routes | 2 |
| Sprint 6 | Unit tests for high-risk components | 3 |
| Sprint 7 | CI pipeline re-enablement | 1 |
| Sprint 8 | Defect tracking setup | 0.5 |
| **Total** | | **6–7 days** |

## Expected Outcome
- Route coverage: 21/24 → **24/24 (100%)**
- Unit test coverage: 12 files → **18 files**, ~120 → **~200 cases**
- CI runs automatically on every push/PR
- Debug specs removed from test suite
- Defect tracking process in place
