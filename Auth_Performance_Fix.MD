# Auth Performance Fix — Sprint Document

## Problem Statement
Navigation between pages is slow because the auth system fires redundant network requests on every route change. Users see loading spinners ("Checking access...") on every admin page transition.

---

## Root Causes

### 1. `useUserRole` fires a network request on EVERY navigation
- **File:** `lib/hooks/use-user-role.ts:55-61`
- **Issue:** `fetchPolicy: "cache-and-network"` always hits the backend, even when cached data exists
- **Impact:** `useUserRole()` is called in 3 places per admin page (AdminProtectedRoute, AdminLayout, AdminBottomNav) = **3 concurrent `GetCurrentUserRole` queries per navigation**

### 2. Double auth gate — two sequential loading spinners
- **File:** `components/auth/admin-protected-route.tsx:59, 99`
- **Issue:** `AdminProtectedRoute` wraps `ProtectedRoute`. User waits for `ProtectedRoute` (localStorage + token refresh), THEN waits for `AdminProtectedRoute` (GraphQL role query)
- **Impact:** Two sequential loading states before content appears

### 3. Duplicated access check logic
- **File:** `components/auth/admin-protected-route.tsx:33-48` and `68-82`
- **Issue:** `hasAccess` is computed identically in both the `useEffect` and the render body
- **Impact:** Code smell, unnecessary re-computation

### 4. Auth initialization is async even for valid tokens
- **File:** `lib/auth/auth-context.tsx:107-177`
- **Issue:** `isLoading` starts `true` and only resolves after a `useEffect` reads localStorage (which is synchronous). This blocks ALL protected routes with a spinner on every hard navigation
- **Impact:** Unnecessary loading flash even when token is valid in localStorage

---

## Fixes

### Fix 1: Change `useUserRole` fetch policy to `cache-first`
- **File:** `lib/hooks/use-user-role.ts`
- **Change:** `fetchPolicy: "cache-and-network"` → `"cache-first"`
- **Why:** User role doesn't change mid-session. First call populates cache, subsequent calls read from cache instantly (no network, no loading state)
- **Effort:** 1 line change

### Fix 2: Synchronous auth initialization for valid tokens
- **File:** `lib/auth/auth-context.tsx`
- **Change:** Initialize `user`, `accessToken`, and `isLoading` from localStorage in `useState` initializers. Only set `isLoading=true` when an async token refresh is actually needed
- **Why:** `localStorage.getItem()` is synchronous — no reason to go through an async useEffect for it. Valid tokens should render protected content immediately
- **Effort:** Moderate refactor of initialization logic

### Fix 3: Flatten `AdminProtectedRoute` — remove ProtectedRoute wrapper
- **File:** `components/auth/admin-protected-route.tsx`
- **Change:** Use `useAuth()` directly instead of wrapping in `<ProtectedRoute>`. Combine both auth + role checks into a single gate
- **Why:** Eliminates the double loading spinner. One check, one loading state
- **Effort:** Moderate refactor

### Fix 4: Deduplicate access check logic
- **File:** `components/auth/admin-protected-route.tsx`
- **Change:** Compute `hasAccess` once with `useMemo`, use in both effect and render
- **Why:** DRY principle, fewer re-renders
- **Effort:** Small refactor (part of Fix 3)

---

## Expected Outcome
- Admin page transitions go from **~1-2s with spinners** to **instant** (cache-served)
- No more "Checking access..." flash between pages
- Network requests for role data drop from **3 per navigation** to **1 total per session**
- Protected route content renders immediately when token is valid in localStorage

---

## Files Modified
| File | Fix |
|------|-----|
| `lib/hooks/use-user-role.ts` | Fix 1 — cache-first policy |
| `lib/auth/auth-context.tsx` | Fix 2 — synchronous init |
| `components/auth/admin-protected-route.tsx` | Fix 3+4 — flatten, deduplicate |
