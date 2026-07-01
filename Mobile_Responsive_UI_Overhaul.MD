Mobile UI Responsiveness Audit Report

  CRITICAL FINDING: No Bottom Navigation Bar

  The app has no bottom nav bar anywhere. Public pages use a top sticky nav with hamburger menu, and admin
  uses a sidebar drawer. For a church PWA (the manifest.ts confirms standalone mode + portrait
  orientation), this is the most impactful gap.

  ---
  Issues by Severity

  P0 - Critical (Broken on Mobile)

  ┌─────┬────────────────────────────┬─────────────────────────────────────────────────────────────────┐
  │  #  │       Page/Component       │                              Issue                              │
  ├─────┼────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ 1   │ Entire app                 │ No bottom navigation bar for mobile. Core actions (Home, Give,  │
  │     │                            │ Events, Dashboard) are buried in hamburger menu                 │
  ├─────┼────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ 2   │ OTP Verification           │ 6 inputs at w-12 (48px) each + gaps = ~312px minimum. Overflows │
  │     │ (verify-otp/page.tsx)      │  on 320px screens                                               │
  ├─────┼────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │     │ Member Dashboard           │ Header has 3-4 buttons ("Admin Panel", "Church Content", "Make  │
  │ 3   │ (dashboard/page.tsx)       │ Contribution", "Logout") in horizontal flex gap-4 with no       │
  │     │                            │ wrapping — overflows off-screen                                 │
  ├─────┼────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ 4   │ No safe-area-inset         │ No env(safe-area-inset-bottom) padding for notched iPhones in   │
  │     │ handling (globals.css)     │ standalone PWA mode                                             │
  └─────┴────────────────────────────┴─────────────────────────────────────────────────────────────────┘

  P1 - Major (Poor Mobile UX)

  ┌─────┬────────────────────────────────┬─────────────────────────────────────────────────────────────┐
  │  #  │         Page/Component         │                            Issue                            │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 5   │ Contributions table (admin)    │ 7 columns — no card/list view alternative for mobile        │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 6   │ Members table (admin)          │ 7 columns + inline editing in table cells — extremely       │
  │     │                                │ cramped on mobile                                           │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 7   │ C2B Transactions table (admin) │ 9 columns — widest table in app, painful horizontal         │
  │     │                                │ scrolling                                                   │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 8   │ Category Admins table (admin)  │ 6 columns per grouped section, horizontal scroll only       │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 9   │ Admin Overview recent          │ No card view alternative                                    │
  │     │ contributions table            │                                                             │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 10  │ Touch targets too small        │ Mobile nav links py-2 (~32px), table action icons h-3 w-3   │
  │     │                                │ (~24px). Minimum should be 44-48px                          │
  ├─────┼────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 11  │ Confirmation page              │ grid-cols-2 details card cramped on narrow screens; action  │
  │     │                                │ buttons in row can be too narrow                            │
  └─────┴────────────────────────────────┴─────────────────────────────────────────────────────────────┘

  P2 - Moderate (Usable but Not Ideal)

  ┌─────┬─────────────────────────────────────────────┬────────────────────────────────────────────────┐
  │  #  │               Page/Component                │                     Issue                      │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ 12  │ Multiple admin headers (contributions,      │ flex justify-between with title + button(s)    │
  │     │ members/import, youtube)                    │ collide on narrow screens                      │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │     │                                             │ Member lookup input + "Lookup" button          │
  │ 13  │ Manual entry form                           │ side-by-side gets squeezed; 3 action buttons   │
  │     │                                             │ at bottom overflow                             │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ 14  │ Announcements/Devotionals/Events admin      │ Bulk action buttons (2-3 buttons) overflow     │
  │     │                                             │ when selections active                         │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ 15  │ YouTube admin header                        │ "Sync from YouTube" + "Add Video" buttons      │
  │     │                                             │ side-by-side overflow                          │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ 16  │ Hero section                                │ min-h-[700px] forces excessive scrolling on    │
  │     │                                             │ short mobile screens                           │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ 17  │ C2B filter select                           │ min-w-[180px] can cause overflow on screens <  │
  │     │                                             │ 360px                                          │
  ├─────┼─────────────────────────────────────────────┼────────────────────────────────────────────────┤
  │ 18  │ Toast position                              │ top-right overlaps with navigation bar on      │
  │     │                                             │ mobile                                         │
  └─────┴─────────────────────────────────────────────┴────────────────────────────────────────────────┘

  P3 - Minor (Polish)

  ┌─────┬─────────────────────────┬────────────────────────────────────────────────────────────────────┐
  │  #  │     Page/Component      │                               Issue                                │
  ├─────┼─────────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ 19  │ Hero decorative         │ Absolute-positioned blur circles may extend beyond mobile viewport │
  │     │ elements                │                                                                    │
  ├─────┼─────────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ 20  │ Featured devotional     │ h-64 may be too tall relative to content on mobile                 │
  │     │ image                   │                                                                    │
  ├─────┼─────────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ 21  │ Hover effects on cards  │ hover:scale-105 is meaningless on touch devices (harmless but      │
  │     │                         │ wasteful)                                                          │
  └─────┴─────────────────────────┴────────────────────────────────────────────────────────────────────┘

  ---
  What's Already Good

  - Tailwind breakpoints (sm:, md:, lg:) used consistently across most pages
  - Admin sidebar has proper mobile drawer with backdrop overlay
  - Contribution form is well-structured for mobile (max-w-md, full-width buttons, h-11 targets)
  - Contribution summary buttons properly stack: flex-col sm:flex-row
  - Categories admin uses card-based list instead of table — great mobile pattern
  - Hero CTA buttons stack on mobile: flex-col sm:flex-row
  - Pagination on members page uses flex-col md:flex-row — well done
  - PWA manifest properly configured with portrait orientation

  ---
  Sprint Breakdown

  Sprint 1: Bottom Nav Bar + Critical Fixes (5-8 days)

  Goal: Make the app functional and non-broken on mobile

  ┌─────────────────────┬──────────┬───────────────────────────────────────────────────────────────────┐
  │        Task         │ Estimate │                              Details                              │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Create BottomNav    │          │ Fixed bottom bar with icons for: Home, Give, Events, Sermons,     │
  │ component           │ 2d       │ More (hamburger). Show on public pages at md:hidden. Include      │
  │                     │          │ pb-[env(safe-area-inset-bottom)]                                  │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Create              │          │ Fixed bottom bar for dashboard/admin with: Dashboard, Members,    │
  │ AdminBottomNav      │ 1.5d     │ Contributions, Reports, More. Show at lg:hidden                   │
  │ component           │          │                                                                   │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Add safe-area-inset │ 0.5d     │ Add env(safe-area-inset-bottom) to globals.css for notched        │
  │  CSS                │          │ phones, adjust body padding when bottom nav present               │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Fix OTP input       │ 0.5d     │ Use w-10 sm:w-12 or a single masked input approach                │
  │ overflow            │          │                                                                   │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Fix dashboard       │ 0.5d     │ Change to flex flex-wrap gap-2 or stack into flex-col sm:flex-row │
  │ header buttons      │          │  with icon-only on mobile                                         │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Fix toast position  │ 0.5d     │ Change to bottom-center on mobile, top-right on desktop           │
  └─────────────────────┴──────────┴───────────────────────────────────────────────────────────────────┘

  Sprint 1 Total: ~5.5 days

  ---
  Sprint 2: Table Responsive Overhaul (5-7 days)

  Goal: Replace horizontal-scroll tables with mobile card views

  ┌──────────────────────────┬──────────┬──────────────────────────────────────────────────────────────┐
  │           Task           │ Estimate │                           Details                            │
  ├──────────────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
  │ Create reusable          │          │ Renders as table on md+, switches to card/list view on       │
  │ ResponsiveTable          │ 1.5d     │ mobile. Accept column config for which fields to show        │
  │ component                │          │ prominently vs. collapse                                     │
  ├──────────────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
  │ Refactor Contributions   │ 1d       │ Card view showing: Member name, amount, date as primary;     │
  │ table                    │          │ category, status as secondary; receipt as action             │
  ├──────────────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
  │ Refactor Members table   │ 1d       │ Card view with: name, phone as primary; role, status as      │
  │                          │          │ secondary; edit/toggle/delete as swipe or tap actions        │
  ├──────────────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
  │ Refactor C2B             │ 1d       │ Card view with: amount, customer, date as primary; status    │
  │ Transactions table       │          │ badge, reference as secondary; resolve action                │
  ├──────────────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
  │ Refactor Category Admins │ 0.5d     │ Card view grouped by category                                │
  │  table                   │          │                                                              │
  ├──────────────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
  │ Refactor Admin Overview  │ 0.5d     │ Reuse contribution card view                                 │
  │ recent table             │          │                                                              │
  └──────────────────────────┴──────────┴──────────────────────────────────────────────────────────────┘

  Sprint 2 Total: ~5.5 days

  ---
  Sprint 3: Touch Targets + Admin Page Headers (3-5 days)

  Goal: Make all interactive elements comfortably tappable and fix layout collisions

  ┌─────────────────────┬──────────┬───────────────────────────────────────────────────────────────────┐
  │        Task         │ Estimate │                              Details                              │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Increase mobile nav │ 0.5d     │ Change py-2 to py-3 (minimum 44px), increase hamburger button     │
  │  touch targets      │          │ padding                                                           │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Increase table      │ 0.5d     │ Icon buttons from h-3 w-3 to h-5 w-5 with p-2 wrapper (total      │
  │ action button sizes │          │ 36-40px)                                                          │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Fix admin page      │          │ All pages with flex justify-between title+buttons: stack on       │
  │ headers             │ 1.5d     │ mobile with flex-col sm:flex-row gap-2. Affected: contributions,  │
  │                     │          │ members/import, youtube, manual-entry                             │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Fix confirmation    │ 0.5d     │ Change to grid-cols-1 sm:grid-cols-2 for details; flex-col        │
  │ page grid           │          │ sm:flex-row for action buttons                                    │
  ├─────────────────────┼──────────┼───────────────────────────────────────────────────────────────────┤
  │ Fix bulk action     │ 1d       │ Wrap admin bulk actions in flex flex-wrap gap-2 or use a dropdown │
  │ button overflow     │          │  menu on mobile                                                   │
  └─────────────────────┴──────────┴───────────────────────────────────────────────────────────────────┘

  Sprint 3 Total: ~4 days

  ---
  Sprint 4: Polish + PWA Enhancements (2-3 days)

  Goal: Final mobile polish pass

  ┌────────────────────────┬──────────┬────────────────────────────────────────────────────────────────┐
  │          Task          │ Estimate │                            Details                             │
  ├────────────────────────┼──────────┼────────────────────────────────────────────────────────────────┤
  │ Fix hero min-h for     │ 0.5d     │ Change to min-h-[500px] md:min-h-[700px]                       │
  │ mobile                 │          │                                                                │
  ├────────────────────────┼──────────┼────────────────────────────────────────────────────────────────┤
  │ Fix manual entry form  │ 0.5d     │ Stack lookup input/button on mobile; make action buttons       │
  │ layout                 │          │ flex-col sm:flex-row                                           │
  ├────────────────────────┼──────────┼────────────────────────────────────────────────────────────────┤
  │ Add active: states for │ 0.5d     │ Replace hover:scale-105 with active:scale-95 on mobile card    │
  │  touch                 │          │ elements                                                       │
  ├────────────────────────┼──────────┼────────────────────────────────────────────────────────────────┤
  │ Clip decorative        │ 0.25d    │ Add overflow-hidden to hero section container                  │
  │ elements               │          │                                                                │
  ├────────────────────────┼──────────┼────────────────────────────────────────────────────────────────┤
  │ Fix C2B filter min-w   │ 0.25d    │ Remove min-w-[180px] or make it responsive                     │
  ├────────────────────────┼──────────┼────────────────────────────────────────────────────────────────┤
  │ Mobile QA testing pass │ 1d       │ Test all pages on iPhone SE (320px), iPhone 14 (390px), and    │
  │                        │          │ Android mid-range (360px)                                      │
  └────────────────────────┴──────────┴────────────────────────────────────────────────────────────────┘

  Sprint 4 Total: ~3 days

  ---
  Total Estimate: ~18 days (4 sprints across ~4 weeks)

  ┌──────────┬─────────────────────────────┬───────────┐
  │  Sprint  │            Focus            │ Duration  │
  ├──────────┼─────────────────────────────┼───────────┤
  │ Sprint 1 │ Bottom Nav + Critical Fixes │ ~5.5 days │
  ├──────────┼─────────────────────────────┼───────────┤
  │ Sprint 2 │ Responsive Tables           │ ~5.5 days │
  ├──────────┼─────────────────────────────┼───────────┤
  │ Sprint 3 │ Touch Targets + Headers     │ ~4 days   │
  ├──────────┼─────────────────────────────┼───────────┤
  │ Sprint 4 │ Polish + QA                 │ ~3 days   │
  └──────────┴─────────────────────────────┴───────────┘