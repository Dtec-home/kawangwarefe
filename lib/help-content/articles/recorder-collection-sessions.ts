import type { HelpArticle } from "../types";

export const RECORDER_COLLECTION_SESSIONS_ARTICLE: HelpArticle = {
  slug: "recorder-collection-sessions",
  title: "Collection sessions: start, close and count",
  category: "Recording giving",
  roles: ["recorder"],
  relatedRoute: "/record",
  body: `A collection session groups the cash you record for one collection — for example "Divine Service" on a Sabbath — so it can be counted and handed over to the treasurer together. It replaces the paper handover sheet.

**Starting a session**
At the top of Record giving, when no session is open, give the session a name ("Divine Service" is filled in for you) and tap "Start collection session". You can record gifts with or without a session, but only gifts recorded while your session is open are counted in it.

**While the session is open**
The banner shows the session name, date, how many receipts are in it and the total recorded so far. Every gift you record today while it is open is added automatically. Gifts recorded by other recorders go into their own sessions.

You can only have one open session at a time.

**Close & count**
When the collection is over, count the cash physically, then tap "Close & count":
1. Enter the Counted cash (KES).
2. Optionally fill in Notes & coins — how many of each note and coin. If you do, the breakdown must add up to the counted cash.
3. The dialog compares the count with what was recorded and shows Balanced, Cash short or Cash over, with the variance.
4. If the count differs from the recorded total, type a reason for the difference (at least 10 characters), e.g. "KES 200 given as change to a visitor".

Save to close the session. Hand the cash to the treasurer, who confirms receiving it in the system.

**A session left open from an earlier day**
If you forgot to close a session, the banner warns you that the session from that date is still open. Close & count it first; gifts recorded today are not added to it. Staff can also close it for you.

**Why it matters**
The treasurer cannot certify a date's Cash Statement while any session for that date is still open.`,
};
