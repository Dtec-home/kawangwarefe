# In-App Help Center — Implementation Report

Branch: `feature/help-center-tutorials` (uncommitted, for review). Implements the sprint plan in `In_App_Help_Center_Sprint_Plan.MD` via a multi-agent workflow (Foundation → 7 parallel content batches → Consolidation → Polish). The workflow hit the account session limit partway through; this report covers the full, now-complete result after resuming Consolidation and Polish manually against the same task list the workflow script defined.

## What was built

**Foundation**
- De-duplicated first-run UX: the onboarding carousel's completion now syncs to the backend (`updateTutorialStatus`, key `onboarding_carousel_v1`), and the dashboard's welcome tour only auto-starts after the carousel is dismissed (previously both fired at once).
- `ReplayTourButton` — shared replay-tour trigger, replacing three copy-pasted buttons (dashboard, admin overview, contribute).
- `HelpButton` — header dropdown (Help Center / WhatsApp us / Email us) mounted once in `AdminLayout` and once in `MemberLayout`.
- `/help` — Help Center page: search, role-aware category grouping (members see `member`-tagged articles; anyone with admin access also sees `admin`-tagged ones), WhatsApp/email footer.

**Tours** — 28 driver.js tours total (3 pre-existing + 25 new), one config file per route under `lib/tours/configs/`, imported directly by its page (no shared registry, by design, to keep the parallel batches conflict-free). Covers every admin route plus dashboard, contribute, profile, profile/family, profile/notifications, prayers/new.

**Help Center articles** — 32 articles under `lib/help-content/articles/`, one file per topic, now wired into `HELP_ARTICLES` in `lib/help-content/index.ts` (this was the piece left undone when the session limit hit — see below). Covers every admin route, four public content pages (announcements/devotionals/events/sermons), and three conceptual FAQ topics: multi-department giving, department member identifiers (Welfare numbers), and receipts/SMS notifications.

**Public pages** — of the four public content pages, only `/events` got an inline dismissible tooltip (highlighting the "Give"/"Register" card actions); announcements/devotionals/sermons were judged too simple to need one and got an article only. This was an explicit per-page judgment call the content batch was instructed to make, not an oversight.

**What was explicitly skipped** — KCB Buni payout mechanics and C2B split-resolution conceptual explanations. Per your decision, these are deferred pending domain-expert review; the admin-finance batch covered only observable UI mechanics for those two screens, and no conceptual FAQ article touches either topic.

## What the session-limit interruption actually left broken

Three phases didn't complete: the `public-content` batch's structured self-report, Consolidation, and Polish. On inspection:
- `public-content`'s file output (4 articles + the events tooltip) was actually complete on disk — only its JSON status return failed. Verified directly rather than trusted.
- Consolidation had not run at all: `HELP_ARTICLES` was still an empty array, meaning **all 32 articles existed as files but the `/help` page would have rendered nothing**. This is now fixed — all 32 are imported and registered.
- One genuine near-duplicate was found during inspection (`giving-to-multiple-departments` and `multi-department-giving`, both covering the same contribution-splitting mechanic) but was left as two separate articles per the plan's actual scope — the consolidation task only calls for resolving slug/tutorialKey *collisions*, not editorial content overlap, so no slug renaming or merging was needed since both slugs were already distinct.

## Consolidation results
- **Duplicate check**: 0 slug collisions (32/32 unique), 0 tutorialKey collisions (28/28 unique across all tour configs), every article's `relatedTourKey` matches a real tour.
- **Typecheck**: `npx tsc --noEmit` — clean.
- **Lint**: clean on all new/touched Help Center and tour files. One pre-existing `no-explicit-any` warning on `app/(public)/events/page.tsx`'s `EventsData` interface predates this workflow (confirmed via diff — not part of the added hunk) and was left alone, per the plan's instruction to fix only workflow-introduced errors.
- **Render path**: read through `/help`'s filtering/search/grouping logic — role filtering and search both work correctly against the now-populated registry.

## Coverage sweep

Every route in the sprint plan's checklist has a tour, an article, or both — no route has neither:

- All 21 admin routes: tour + article.
- `/dashboard`, `/contribute`, `/profile`, `/profile/family`, `/profile/notifications`, `/prayers/new`: tour + article.
- `/announcements`, `/devotionals`, `/events`, `/sermons`: article only (by design — see above); `/events` additionally has the dismissible tooltip.

Minor nit (not fixed, out of scope for consolidation): the `admin-category-purposes` article's `relatedRoute` points to the parent `/admin/categories` rather than the more specific `/admin/categories/[id]/purposes` where its tour actually lives. Cosmetic — the field is a UI link hint, not validated elsewhere.

## Accessibility pass (code-level only — no browser/screen-reader run)

Two straightforward issues found and fixed directly:
- `ReplayTourButton` collapses to icon-only on narrow screens with only a `title` attribute (unreliable for screen readers/touch) — added `aria-label="Replay tour"`.
- The Help Center's article cards were click-to-expand `<div>`s with no keyboard equivalent — added `role="button"`, `tabIndex`, `aria-expanded`, and Enter/Space handling.

`HelpButton`'s dropdown uses the existing shadcn/Radix `DropdownMenu` primitives, which already handle focus/keyboard/ARIA correctly — no changes needed there.

Anything needing a real browser or screen-reader pass is listed in the QA checklist below rather than claimed as verified here.

## Test suite

`npx vitest run` — 851 tests, 1 failure found and fixed: `__tests__/app/admin/campaign-detail.test.tsx` mocked `@apollo/client/react` without `useMutation`, which broke once the `admin-messaging-detail` tour's `useTour()` call (which internally calls `useMutation`) was added to that page. Added `useMutation: () => [vi.fn(), { loading: false }]` to the mock, matching the convention already used in every other admin page test. Full suite now green (851/851).

## Manual QA checklist before merge

- [ ] Click through the app in a browser as both a member and an admin; confirm the carousel fires once, then the dashboard tour, in that sequence (not simultaneously).
- [ ] Replay a tour from a couple of different pages via the new `ReplayTourButton` and confirm it restarts correctly.
- [ ] Open the Help Center (`/help`) as a member and as an admin; confirm the admin sees the extra admin-tagged articles and the member doesn't.
- [ ] Use keyboard-only navigation to expand/collapse a couple of Help Center article cards (Tab + Enter/Space).
- [ ] Confirm the WhatsApp link (`https://wa.me/254703943726`) and email link (`mailto:info@sdakawangware.org`) both work from the HelpButton dropdown and the Help Center footer.
- [ ] Screen-reader pass on `HelpButton`, `ReplayTourButton`, and the `/help` page — this report only covers static code review, not a live audit.
- [ ] Review the full `git diff` on this branch before merging — it touches ~40 files across admin/member layouts, onboarding, and every tour-enabled page.
