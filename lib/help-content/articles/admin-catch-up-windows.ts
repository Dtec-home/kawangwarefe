import type { HelpArticle } from "../types";

export const ADMIN_CATCH_UP_WINDOWS_ARTICLE: HelpArticle = {
  slug: "admin-catch-up-windows",
  title: "Catch-up windows for past dates",
  category: "Treasury administration",
  roles: ["admin"],
  relatedRoute: "/admin/catch-up-windows",
  body: `Nobody can backdate giving — not recorders, not treasurers, not admins. Manual, cash and envelope entries are always recorded for today. When gifts genuinely belong to a past date — for example the internet was down during the Sabbath service and paper slips were used — an admin opens a catch-up window for that one date.

**Opening a window (admins only)**
Go to Admin → Finance → Catch-up windows (/admin/catch-up-windows) and fill in:
- Date to open — a past date. Today and future dates can't be opened.
- Reason — at least 10 characters, e.g. "Internet outage during service".
- Duration (hours) — default 24, from 1 up to 72.
Click "Open catch-up window". Treasurers and pastors can see the page, but only admins can open or close windows.

**While a window is open**
Anyone with recording rights (recorders and staff) sees a "Recording for" selector on Record giving and Manual Entry, where they can choose the window's date instead of Today. The entry is dated that day and its receipt number starts with that date (e.g. 20260829-…). Every entry recorded through a window is audit-logged.

**Closing a window**
Windows close by themselves when they expire. To close one early — for example once the paper slips are all entered — click close on it under "Open windows".

**Certified dates**
A window can't be opened for a date whose statement is certified; unlock the statement first. If a date is certified while a window is open, entries for it are refused.

**Good practice**
- Keep at least two people in the admin role so a window can always be opened when needed.
- Use the shortest duration that works, and close the window when catch-up is done.
- Opening, using and closing windows are all audit-logged.`,
};
