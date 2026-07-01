# Frontend Performance Audit — church-funds-ui

**Date:** 2026-03-06
**Auditor:** Antigravity
**Stack:** Next.js 16, React 19, Apollo Client, Tailwind CSS v4, TypeScript

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 5 |
| 🟡 Medium | 5 |
| 🔵 Low | 4 |

---

## 🔴 Critical Issues

### 1. Homepage is a Client Component — SSR Disabled for the Landing Page

**File:** `app/page.tsx` (line 1)

```tsx
"use client"; // ← this kills server-side rendering for the root page
```

Because the homepage is marked `"use client"`, Next.js renders it entirely in the browser. This means:
- **No HTML is pre-rendered** on the server; users see a blank page until the JS bundle loads and the GraphQL fetch completes.
- **Crawlers and social preview bots** (WhatsApp, Twitter, etc.) receive an empty shell, undermining all the SEO work done in `layout.tsx`.
- **LCP (Largest Contentful Paint) is delayed** by at least one full network round-trip.

**Fix:** Remove `"use client"` from `app/page.tsx`. Use `async` Server Components to fetch the landing page data via Apollo SSR or `fetch()`, and only mark interactive sub-components (e.g. `Navigation`) as client components.

---

### 2. Apollo Client Forces `cache: "no-store"` on Every Request

**File:** `lib/graphql/apollo-client.tsx` (line 64)

```tsx
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql",
  fetchOptions: { cache: "no-store" }, // ← disables all HTTP caching
});
```

This option is passed globally, which means **every single GraphQL query** — including public, read-only queries for announcements, devotionals, events, and YouTube videos — bypasses the browser/CDN cache. The landing page data is fetched fresh on every page load.

**Fix:** Remove `cache: "no-store"` as the global default. For public, infrequently-changing data (announcements, events, YouTube videos), use `cache: "force-cache"` or `"default"`. Reserve `"no-store"` for mutations and personally-identifiable queries.

---

### 3. YouTube Iframes Eagerly Loaded

**File:** `components/landing/youtube-section.tsx` (lines 78–84)

```tsx
<iframe
  src={featured.embedUrl}
  title={featured.title}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  className="w-full h-full"
/>
```

Each `<iframe>` for YouTube is rendered immediately on page load, causing:
- A **separate HTTP connection** to `youtube.com` even before the user interacts.
- YouTube embeds load their own JS bundles, cookies, and tracking scripts, costing **300–600 KB** of extra data per iframe.
- Significant **TBT (Total Blocking Time)** and **CLS** impact.

**Fix:** Use a "lite" facade pattern — show a thumbnail image and a play button; only inject the real `<iframe>` after the user clicks it (lazy embed). Libraries like `react-lite-youtube-embed` handle this automatically.

---

### 4. `next.config.ts` is Completely Empty

**File:** `next.config.ts`

```ts
const nextConfig: NextConfig = {
  /* config options here */
};
```

The app is missing all standard Next.js production optimizations:
- **No image domain allowlist** — Next.js Image Optimization will reject external image URLs (e.g. YouTube thumbnails) at runtime.
- **No `compress: true`** (gzip/brotli — though enabled by default, it can be fine-tuned).
- **No `poweredByHeader: false`** — unnecessarily reveals the framework.
- **No bundle analyser** integration for monitoring.

**Fix:** At minimum, add:
```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  poweredByHeader: false,
};
```

---

## 🟠 High Issues

### 5. Two Toast Libraries Installed and Both Loaded

**Files:** `package.json`, `app/layout.tsx`

Both `react-hot-toast` (a runtime dependency) and `sonner` are installed. `layout.tsx` renders `<Toaster>` from `react-hot-toast`. This means **two notification libraries** are shipped in the bundle.

**Fix:** Pick one and remove the other. `sonner` is the more modern choice and integrates better with RSC; it can replace `react-hot-toast` entirely. Uninstall the unused library with `npm uninstall react-hot-toast`.

---

### 6. Raw `<img>` Tags Instead of Next.js `<Image>`

**File:** `components/landing/youtube-section.tsx` (lines 116–120)

```tsx
<img
  src={video.thumbnailUrl}
  alt={video.title}
  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
/>
```

Using a raw `<img>` bypasses Next.js's automatic:
- **WebP/AVIF conversion** (20–40% size reduction)
- **Responsive `srcset`** generation
- **Lazy loading** by default
- **Priority loading** control

**Fix:** Replace with `<Image>` from `next/image` and specify `width`/`height` or use `fill` mode.

---

### 7. Landing Page Single GraphQL Query Fetches All Sections at Once, Blocking Render

**File:** `app/page.tsx` (lines 21–31)

```tsx
const { loading, error, data } = useQuery<LandingPageData>(GET_LANDING_PAGE_CONTENT);

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
```

A single query fetches announcements, devotionals, events, and YouTube videos. **The entire page renders nothing** (just a spinner) until all four datasets are returned. If any section is slow, it blocks all others.

**Fix:** Split into independent queries per section, allowing sections to render as their data arrives. Using `@defer` (supported by the Apollo stack in use) would let the page render progressively.

---

### 8. `useUserRole` Hook Uses `cache-and-network` Fetch Policy

**File:** `lib/hooks/use-user-role.ts` (line 56)

```ts
fetchPolicy: "cache-and-network",
```

`cache-and-network` immediately returns cached data (causing one render) then fires a network request and re-renders again on completion. For a **role/permission check that is called throughout the dashboard**, this causes a double-render on every page navigation, and the role UI may flicker between initial cached state and network-fetched state.

**Fix:** Use `cache-first` for role data (it changes rarely). If freshness is critical, implement background revalidation on a longer interval rather than on every mount.

---

### 9. `makeClient` Creates a New `InMemoryCache` on Every SSR Request

**File:** `lib/graphql/apollo-client.tsx` (lines 61–133)

The `makeClient` function is passed directly to `ApolloNextAppProvider`. On the server, this creates a **new Apollo Client and cache per request**, which is correct — but it also means there is no per-request cache sharing across parallel component renders. This is acceptable but should be documented; currently the comment is misleading ("Following SRP").

More importantly, `makeClient` uses `typeof window === "undefined"` checks inside the closure to switch between SSR and client-side link chains, but because the function is defined as `"use client"`, this branch is **never exercised on the server** by Next.js App Router.

**Fix:** Separate server-side and client-side Apollo Client setup into distinct files, as recommended by `@apollo/client-integration-nextjs`.

---

## 🟡 Medium Issues

### 10. Array Index Used as `key` in `MultiCategorySelector`

**File:** `components/forms/multi-category-selector.tsx` (line 99)

```tsx
{contributions.map((contribution, index) => (
  <CategoryAmountRow key={index} ... />
))}
```

Using the array index as a key causes React to incorrectly reuse DOM nodes when items are removed or reordered (e.g. when "Remove" is clicked on a row). This leads to stale input values.

**Fix:** Use a stable unique ID — either generate a `uuid` when each row is added, or use `categoryId` if it's always set.

---

### 11. `any[]` Types on Landing Page Data

**File:** `app/page.tsx` (lines 14–18)

```ts
interface LandingPageData {
  announcements: any[];
  devotionals: any[];
  events: any[];
  youtubeVideos: any[];
}
```

`any` types defeat TypeScript's ability to catch bugs at compile time. These are the same types already defined in the individual section components (e.g. `Announcement` in `announcements-section.tsx`).

**Fix:** Export and reuse the typed interfaces from each section component, or generate types from the GraphQL schema using `graphql-codegen`.

---

### 12. Google Verification Code is a Placeholder

**File:** `app/layout.tsx` (line 87)

```ts
verification: {
  google: "your-google-verification-code",
},
```

The Google Search Console verification meta tag contains a literal placeholder string. Search Console validation will fail.

**Fix:** Register the site in Google Search Console and replace with the real verification code, or remove the field until verified.

---

### 13. Placeholder Phone Number in Structured Data

**File:** `components/seo/structured-data.tsx` (line 15)

```ts
telephone: "+254-XXX-XXX-XXX",
```

A placeholder telephone number in JSON-LD structured data is worse than omitting the field — it provides incorrect information to search engines.

**Fix:** Replace with the real phone number or remove the `telephone` field.

---

### 14. `<Toaster>` Rendered Inside `<AuthProvider>` Instead of Sibling

**File:** `app/layout.tsx` (lines 104–131)

```tsx
<ApolloWrapper>
  <AuthProvider>
    {children}
    <Toaster ... />  {/* ← inside AuthProvider */}
  </AuthProvider>
</ApolloWrapper>
```

`<Toaster>` is a singleton UI element with no dependency on auth context. Nesting it inside `<AuthProvider>` means it re-renders whenever auth state changes.

**Fix:** Move `<Toaster>` to be a sibling of `<AuthProvider>`, outside all context providers.

---

## 🔵 Low Issues

### 15. CSS Animations Not Behind `prefers-reduced-motion`

**File:** `app/globals.css` (lines 124–167)

The custom `animate-fade-in`, `animate-slide-up`, and `animate-pulse-slow` animations run unconditionally. Users who have enabled "Reduce Motion" in their OS settings will still see all animations, which can be an accessibility concern and may cause nausea.

**Fix:** Wrap animation declarations in `@media (prefers-reduced-motion: no-preference)`.

---

### 16. Multiple `blur-3xl`/`blur-2xl` Elements Rendered in Hero

**File:** `components/landing/hero.tsx` (lines 12–15)

```tsx
<div className="absolute top-20 left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-3xl animate-pulse-slow" />
<div className="absolute top-40 right-20 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl animate-pulse-slow" ... />
<div className="absolute bottom-32 left-1/4 w-40 h-40 bg-teal-300/15 rounded-full blur-3xl animate-pulse-slow" ... />
<div className="absolute bottom-20 right-1/3 w-28 h-28 bg-emerald-300/15 rounded-full blur-2xl animate-pulse-slow" ... />
```

`backdrop-blur` and `filter: blur()` are GPU-intensive CSS properties — especially when animated. Four continuously-animating blurred elements can cause **dropped frames on low-end devices**.

**Fix:** Use a static SVG/PNG gradient instead, or apply `will-change: opacity` and avoid animating `transform` + `opacity` simultaneously.

---

### 17. Logo in Navigation Has No Explicit `width`/`height`

**File:** `components/landing/navigation.tsx` (lines 26–33)

```tsx
<div className="relative w-10 h-10">
  <Image src="/logo.png" alt="SDA Church" fill className="object-contain" />
</div>
```

The wrapping `div` constrains the size, so this isn't causing CLS. However, the logo image could benefit from adding `priority` since it is above the fold.

**Fix:** Add `priority` to the `<Image>` to ensure the logo is preloaded.

---

### 18. `date-fns` Imported Without Tree-Shaking Guard

**File:** `components/landing/announcements-section.tsx` (line 5)

```tsx
import { format } from "date-fns";
```

This is fine as-is since `date-fns` v4 is fully tree-shakeable. However, if any code ever imports from `"date-fns/locale"` with a broad import (e.g. `import * as locales from "date-fns/locale"`), it would pull in the full locale registry. Document this convention for contributors.

---

## Prioritised Fix Plan

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Remove `"use client"` from homepage | Medium | 🔴 LCP / SEO |
| 2 | Remove global Apollo `cache: "no-store"` | Low | 🔴 Network / TTFB |
| 3 | Lazy-load YouTube iframes | Low | 🔴 TBT / Bundle |
| 4 | Populate `next.config.ts` with remotePatterns | Low | 🔴 Image Opt |
| 5 | Remove duplicate toast library | Low | 🟠 Bundle size |
| 6 | Replace `<img>` with `<Image>` in YouTube section | Low | 🟠 Image Opt |
| 7 | Split landing page query or use `@defer` | High | 🟠 FCP |
| 8 | Fix `useUserRole` fetch policy | Low | 🟠 Re-renders |
| 9 | Fix array index keys in `MultiCategorySelector` | Low | 🟡 Correctness |
| 10 | Fix placeholder values (phone, Google code) | Low | 🟡 SEO |
| 11 | Add `prefers-reduced-motion` guards to CSS | Low | 🔵 A11y |
| 12 | Add `priority` to nav logo `<Image>` | Low | 🔵 LCP |
