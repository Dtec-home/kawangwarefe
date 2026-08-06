# In-App Tutorials & Help Center — Audit + Sprint Plan

> Audit date: 2026-08-01. Scope: `church-funds-ui/` only (Next.js frontend). Backend
> touchpoints are called out where a frontend change needs a matching API change.

## TL;DR

The scaffolding for in-app tutorials already exists — a real generic backend model,
a working `driver.js` tour hook, and a first-run carousel — but it was built for
**3 screens out of 33+ routes**, has **no global "Help" entry point**, and has
**zero written help content** (no FAQ, no glossary, no how-it-works copy). Admins
get no onboarding at all beyond the same tour pattern used for members. This plan
adds a dedicated Help Center, a persistent Help button on every authenticated
screen, expands contextual tours to full coverage, and builds a real
first-run/role-aware onboarding path for both audiences — in 6 sprints.

---

## 1. Audit — What Already Exists

### 1.1 Backend (`church_BE/`)
- `members/models.py` → `TutorialState` model: one row per user, `completed_tutorials`
  JSONField (`{tutorial_key: bool}`). **Generic** — new tutorial keys need zero backend
  migration, just a frontend string.
- `api_schema/tutorial_mutations.py` → `updateTutorialStatus(tutorialKey, completed)`,
  `resetAllTutorials`. Both work, both authenticated-only.
- `api_schema/queries.py` → `isTutorialCompleted(tutorialKey)`, `myTutorialState`.
- No admin/staff-specific tutorial state, no org-wide "tutorial version" concept (if
  you edit a tour's steps, users who already completed it never see the update).

### 1.2 Frontend infrastructure
- `driver.js` (v1.4.0) is the tour engine — already a dependency, MIT-licensed,
  no extra install needed.
- `hooks/use-tour.ts` — wraps `driver.js`, syncs completion to the backend via the
  mutations above, supports `autoStart` and (optionally) a manual `reset`.
- `lib/tours/tour-configs.ts` — **3 tour configs only**:
  `WELCOME_TOUR_CONFIG` (member dashboard), `CONTRIBUTION_FLOW_TOUR_CONFIG`
  (`/contribute`), `ADMIN_DASHBOARD_TOUR_CONFIG` (admin overview). Also exports a
  `createTourConfig()` helper, so adding new tours is cheap once someone writes the
  copy.
- `components/onboarding/OnboardingCarousel.tsx` + `lib/hooks/use-onboarding.ts` —
  a 4-slide "welcome to the app" carousel shown once to members. **State lives only
  in `localStorage`** (`cfms_onboarding_complete`) — doesn't sync to the backend, so
  it resets on a new device/browser and admins never see it (it's wired only into
  the member `/dashboard` page).
- `data-tour="..."` attributes actually present in the DOM: `dashboard-header`,
  `dashboard-stats`, `dashboard-snapshot`, `dashboard-history` (member dashboard),
  `admin-header`, `admin-stats`, `admin-contributions`, `admin-members` (admin
  overview), `contribution-form/header/phone/categories/review-btn` (contribute page).
  **That's it — 13 anchors across the entire app.**
- "Replay tour" affordance: a `HelpCircle`-icon button exists **locally on 3 pages**
  (`/dashboard`, `/admin`, `/contribute`) that calls `tour.start()`. It is not a
  shared component — it's copy-pasted per page — and it only replays that page's
  tour, nothing else.

### 1.3 What does NOT exist
- **No dedicated Help Center** (no `/help` route, no FAQ, no searchable articles).
- **No global Help button.** `AdminLayout` and `MemberLayout` headers have zero help
  affordance — the only "Help"-ish icons are the 3 local replay buttons above, and
  a `HelpCircle` icon is not present in either shared layout header at all.
- **Zero `Tooltip` component usage** anywhere in `app/` or `components/` — no
  inline field-level help on any form (contribution splitting, bulk import,
  expense payout, KCB Buni disbursement, C2B split resolution — all fairly complex
  flows with no in-context guidance).
- **No admin-specific onboarding.** New admins/dept-admins are provisioned by an
  existing staff admin via `/admin/category-admins` (role assignment on an
  existing member record) — there is no invite email, no "welcome, here's what
  you can do" flow, and no tour differentiates a first-time Dept Admin from a
  returning Staff Admin. The one `ADMIN_DASHBOARD_TOUR_CONFIG` covers 4 elements
  on the Overview page only; the other 20 admin routes (Contributions, Members,
  Reports, Expenses, C2B, Categories, Groups, Dept Admins, Content, Leaders,
  Messaging, Prayers, Announcements, Devotionals, Events, Receipt Settings,
  YouTube, Members Import, Manual Entry, Category Purposes, Messaging detail) have
  **no tour, no help copy, nothing**.
- **No FAQ / glossary / "how does M-Pesa split giving work" explainer** anywhere,
  despite the app having genuinely non-obvious concepts (multi-department single
  M-Pesa prompt, C2B split resolution, welfare/department member identifiers, KCB
  Buni payout approval chain).
- **No search.** Nothing to search, since there's no content.
- **No analytics on tutorial engagement** — the backend records completion per key
  but nothing surfaces "% of admins who've seen the Reports tour" anywhere.
- `/about` exists and is linked from every screen (header "About" button in both
  layouts), but it's church info (mission blurb + leaders list) — not help content.
  It's the closest thing to a persistent "extra" button today, which is useful
  precedent for where a Help button should sit.

---

## 2. Current Onboarding Flows (as experienced today)

### Member
1. `/login` → phone number → OTP → `/verify-otp`.
2. If `isNewMember` (returned by the verify mutation) → `/register` → collect
   first/last name, department, group → `completeRegistration` → land on
   `/dashboard`.
3. `/dashboard` mounts `OnboardingCarousel` (4 slides, skippable, localStorage-only)
   **and** `useTour(WELCOME_TOUR_CONFIG)` (driver.js, backend-tracked) — **two
   separate "welcome" experiences stacked on first load**, from two different
   onboarding systems built at different times, with no coordination between them.
4. First visit to `/contribute` fires `CONTRIBUTION_FLOW_TOUR_CONFIG`.
5. Nothing else in the member app (Prayers, Family, Notifications, Profile) has
   any tour or help copy.

### Admin
1. Becomes an admin via `/admin/category-admins` (assigned by an existing staff
   admin) or is provisioned directly with a role — **no distinct "you're now an
   admin" moment in the UI**. They just start seeing extra nav items.
2. First visit to `/admin` fires `ADMIN_DASHBOARD_TOUR_CONFIG` (4 steps).
3. Every other admin screen — including financially consequential ones like
   Expenses/KCB Buni payouts, C2B transaction resolution, bulk member import,
   messaging/SMS — has zero guidance.

**Net effect:** a brand-new member gets a reasonably polished (if duplicated)
welcome; a brand-new admin — often a volunteer treasurer or dept admin with no
software background — gets almost nothing, on the parts of the app with the
highest stakes (money movement, bulk data, SMS costs).

---

## 3. Gap Analysis

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| G1 | No global Help button / Help Center | Users can't find help unless a dev happened to add a local replay button on that exact page | **Critical** |
| G2 | 20/21 admin routes have no tour or help copy | Admins self-teach on live financial/member data; highest support-ticket risk area | **Critical** |
| G3 | No FAQ / conceptual explainers (split giving, C2B, Buni payouts, welfare numbers) | Repeated WhatsApp/phone questions to church office; the memory log shows these are the newest, least-intuitive features | **High** |
| G4 | Two competing "first-run" systems (localStorage carousel vs backend-tracked tour) stacked on the same page | Confusing double-modal on first load; carousel state doesn't survive device switch | **High** |
| G5 | No admin-specific first-run moment | New dept/staff admins get no orientation to their scope (e.g. "you can only see X department") | **High** |
| G6 | Zero inline `Tooltip` usage on complex forms | Contribution multi-category split, bulk import CSV format, expense payout approval chain — all undocumented in-context | **Medium** |
| G7 | No content search | Moot until G3 is built, but needed once it is | **Medium** |
| G8 | No tutorial versioning | Editing a tour's steps doesn't reset users who already dismissed the old version | **Medium** |
| G9 | No completion/engagement analytics | Can't tell if tutorials are working or being skipped instantly | **Low-Medium** |
| G10 | No accessibility pass on driver.js tours | Popover focus trapping / screen-reader labelling unverified | **Medium** |
| G11 | Help/carousel copy hardcoded in TS files, not editable without a deploy | Church office staff can't tweak wording without engineering | **Low** (nice-to-have) |

---

## 4. Target Design

- **One Help Center** at `/help`, role-aware (shows Member sections to members,
  Member + Admin sections to admins), with:
  - Search bar (client-side fuzzy search over a static content index to start —
    no backend needed for v1).
  - Category cards: *Getting Started*, *Giving & Contributions*, *Prayers &
    Community*, *My Profile & Family* (member); *Contributions & Reports*,
    *Members & Import*, *Departments & Groups*, *Expenses & Payouts (KCB Buni)*,
    *C2B / M-Pesa Transactions*, *Messaging*, *Content & Events* (admin).
  - Each article: short markdown-rendered explainer + a "Take me there" deep link
    that navigates to the relevant screen **and** auto-fires that screen's
    `driver.js` tour.
  - FAQ accordion per category.
  - "Still stuck? Contact the church office" footer (phone/WhatsApp link — reuse
    whatever contact info already exists on `/about` or in SMS templates).
- **One persistent Help button**, `HelpCircle` icon, added once to `AdminLayout`
  and `MemberLayout` headers (next to `ThemeToggle`/`About`) — not per-page. Opens
  a lightweight menu: *Help Center*, *Replay tour for this page* (if one exists),
  *Contact support*. This single component replaces the 3 copy-pasted local
  buttons.
- **Contextual tours** extended to every admin route and the remaining member
  routes, authored with the existing `createTourConfig()` helper — no new engine
  work required, just content + `data-tour` anchors.
- **One first-run system**, not two: retire the localStorage carousel's dashboard
  auto-mount in favor of the backend-tracked tour sequence, OR fold the carousel's
  slides into step 1 of the Welcome Tour. (Recommendation: keep the carousel's
  friendlier visual style but drive it off `TutorialState` like everything else,
  so it's consistent across devices — see Sprint 1.)
- **Admin first-run**: a role-aware welcome tour that adapts copy to
  Staff/Dept/Group/Content admin scope (the data — `isStaff`, `isCategoryAdmin`,
  `adminCategories`, etc. — already comes back from `useUserRole()`).
- **Tutorial versioning**: append a version suffix to `tutorialKey`
  (e.g. `admin_reports_v2`) so edited tours re-surface — a convention, not new
  backend work.

---

## 5. Sprint Breakdown

Sized for a small frontend team (1–2 devs) with occasional backend support. Each
sprint ~1 week; adjust to your actual cadence.

### Sprint 1 — Help Center shell + unify first-run + global Help button
**Goal:** every screen has a working Help entry point, even before content is fully written.
- Backend: none required (existing `TutorialState`/mutations are enough); optionally
  add a `tutorialVersion` convention doc, no schema change.
- Frontend:
  - Build `/help` route (role-aware shell, category grid, empty-state-friendly —
    ok if only 2–3 articles exist at sprint end).
  - Build one shared `<HelpButton />` component; mount in `AdminLayout` and
    `MemberLayout` headers (replacing the 3 local replay buttons).
  - Reconcile `OnboardingCarousel` + `WELCOME_TOUR_CONFIG` into a single first-run
    sequence, state-tracked via `TutorialState` (drop the localStorage-only flag
    or migrate it to also call `updateTutorialStatus`).
  - Add a lightweight client-side search index (array of `{title, body, url}`,
    filtered on keystroke — no new dependency needed for this volume of content).
- Acceptance: Help button visible and functional on all 33+ routes; first-run
  member flow shows exactly one welcome experience; `/help` loads for both roles.

### Sprint 2 — Admin tour coverage (the highest-risk gap)
**Goal:** every admin route has a contextual tour and a Help Center article.
- Author `data-tour` anchors + tour configs for: Contributions, Members (+ Import),
  Reports, Expenses (KCB Buni payout flow — extra care here, real money), C2B
  Transactions, Categories/Departments (+ Purposes), Groups, Dept Admins,
  Messaging (+ compose detail), Prayers, Content, Leaders, Announcements,
  Devotionals, Events, Receipt Settings, YouTube.
- Role-adapt the Overview tour copy per `useUserRole()` scope (Staff vs Dept vs
  Group vs Content admin).
- Write matching Help Center articles for each (short: what it's for, 3-5 steps,
  1 gotcha).
- Acceptance: no admin route ships without a `data-tour`-anchored tour and an
  article; QA pass as a Dept Admin (limited nav) and as Staff Admin (full nav).

### Sprint 3 — Member tour + content coverage
**Goal:** close remaining member-facing gaps.
- Tours + articles for: Profile, Profile/Family, Profile/Notifications,
  Prayers/New. Extend the Contribute tour to cover edge cases (multi-department
  split specifically, since it's the app's least obvious mechanic).
- Public-facing pages (Announcements, Devotionals, Events, Sermons) — lighter
  touch: a one-time inline banner or single tooltip rather than a full tour, since
  these are simple content pages.
- Acceptance: every member/public route reachable from `MemberLayout`/`BottomNav`
  has either a tour or at least one Help Center article referencing it.

### Sprint 4 — Conceptual FAQ + inline tooltips for complex flows
**Goal:** answer the "why does this work this way" questions that a step-by-step
tour can't, and add point-of-need micro-help inside forms.
- Write FAQ/explainer articles: multi-department single M-Pesa prompt, C2B split
  resolution, welfare/department member identifiers, KCB Buni disbursement +
  approval chain, bulk member import CSV format, receipt/SMS behavior.
- Add `Tooltip` (shadcn component already in the design system, just unused) next
  to the genuinely non-obvious fields identified in these flows — contribution
  form category/purpose picker, bulk import mapping, expense payout status states,
  C2B match/unmatch actions.
- Acceptance: each explainer video/diagram-free article is written by someone who
  can validate against the actual backend behavior (recommend a domain review pass
  with whoever owns KCB Buni/C2B — see memory: `project_kcb_buni_disbursement.md`,
  `project_may2026_features.md`).

### Sprint 5 — Search polish, analytics, accessibility
**Goal:** make the Help Center actually usable at scale and measurable.
- Improve search (basic fuzzy match / highlight matched term) if the flat array
  approach from Sprint 1 feels thin once ~40+ articles exist.
- Add lightweight engagement tracking: reuse `TutorialState`/a new
  `help_article_viewed` event or simplest-possible approach — log via existing
  analytics if the app has any, otherwise a minimal backend counter.
- Accessibility pass on `driver.js` popovers (focus trap, `aria-live`, keyboard
  Esc/Tab behavior) and on the Help Center itself (landmark roles, skip link,
  contrast against the existing OKLCH design tokens per
  `project_ui_design_system.md`).
- Acceptance: axe/lighthouse a11y check passes on `/help` and on 2 sample tour
  popovers; a documented (even if manual) way to see "which tutorials get
  skipped."

### Sprint 6 — Content ops + hardening
**Goal:** make Help Center content maintainable without an engineer, and fix
rough edges found in earlier sprints' QA.
- Move article copy out of hardcoded TSX into a simple structured source (JSON/MD
  files under `lib/help-content/` is enough — no CMS needed at this scale) so
  non-engineers can PR copy changes.
- Regression pass: verify tutorial versioning convention actually re-surfaces
  edited tours; verify `resetAllTutorials` (already exists, currently unused in
  the UI) is exposed somewhere reasonable (e.g. a "Replay all tutorials" toggle
  in Profile settings) for QA and for users who want a refresher.
- Final device/browser sweep (the PWA angle matters — check `app/offline` doesn't
  orphan the Help button, and that tours don't break in standalone/installed mode).
- Acceptance: full route sweep confirms 100% of the 33+ routes have either a tour,
  an article, or both; `/help` is discoverable within 1 tap/click from anywhere.

---

## 6. Coverage Checklist (use as the sprint tracking source of truth)

**Member/Public (10 routes)**
`/dashboard` ✅tour(dup with carousel — fix Sprint 1) · `/contribute` ✅tour ·
`/profile` ❌ · `/profile/family` ❌ · `/profile/notifications` ❌ ·
`/prayers/new` ❌ · `/announcements` ❌ · `/devotionals` ❌ · `/events` ❌ ·
`/sermons` ❌

**Admin (21 routes)**
`/admin` ✅tour(overview only) · `/admin/contributions` ❌ ·
`/admin/contributions/manual-entry` ❌ · `/admin/members` ❌ ·
`/admin/members/import` ❌ · `/admin/reports` ❌ · `/admin/expenses` ❌ ·
`/admin/c2b-transactions` ❌ · `/admin/categories` ❌ ·
`/admin/categories/[id]/purposes` ❌ · `/admin/category-admins` ❌ ·
`/admin/groups` ❌ · `/admin/content` ❌ · `/admin/leaders` ❌ ·
`/admin/messaging` ❌ · `/admin/messaging/[id]` ❌ · `/admin/prayers` ❌ ·
`/admin/announcements` ❌ · `/admin/devotionals` ❌ · `/admin/events` ❌ ·
`/admin/receipt-settings` ❌ · `/admin/youtube` ❌

**Auth (4 routes — part of onboarding itself, not tour targets)**
`/login` · `/register` · `/verify-otp` · `/link-phone`

---

## 7. Risks / Open Questions for the User

1. **Carousel vs tour de-dup (Sprint 1):** recommend keeping the carousel's visual
   style (nicer for first-run) but firing driver.js element tours *after* it for
   returning-to-a-new-page moments. Confirm this is the desired UX before Sprint 1
   starts, since it changes what "Welcome Tour" means going forward.
2. **Content authorship for Sprint 4 (FAQ):** the KCB Buni and C2B split flows are
   financially sensitive — recommend a subject-matter review (treasurer/whoever
   built those features) sign off on the FAQ wording before publishing, not just
   an engineering pass.
3. **Contact support channel:** need the actual phone/WhatsApp number or email to
   put in the Help Center footer — didn't find one hardcoded anywhere in the
   frontend to reuse.
4. **Search scale:** flat-array client search is fine through Sprint 5; if the
   Help Center grows well past ~50 articles, revisit with a real search index.
