import type { HelpArticle } from "../types";

export const ADMIN_ASSIGNING_RECORDER_ROLE_ARTICLE: HelpArticle = {
  slug: "admin-assigning-recorder-role",
  title: "Assigning the Recorder role",
  category: "Treasury administration",
  roles: ["admin"],
  relatedRoute: "/admin/members",
  body: `The Recorder role lets deacons, clerks and other helpers record cash and envelope giving and issue receipts — without giving them treasurer, admin or pastor rights.

**Assigning it (admins and pastors)**
1. Make sure the person is a registered member whose phone can receive the login code (OTP).
2. On Admin → Members, find them and open Roles (the shield icon).
3. Tick "recorder" ("Can record cash/envelope giving only"). The change takes effect straight away.
To remove it, untick the role the same way. Assigning and removing roles is audit-logged.

**What a recorder can do**
- Log in and land on Record giving (/record).
- Record cash and envelope gifts for today (or for a date an admin has opened a catch-up window for), and issue receipts.
- Look up a giver by phone — only the name is shown.
- Start and close collection sessions, and count the cash.
- See their own entries for today, print receipts, resend SMS receipts and request voids.
- Use their own member area (dashboard, their own giving).

**What a recorder cannot do**
View reports, exports, the receipts register, members, expenses, messaging or settings; see other people's entries; edit entries; void receipts; or record M-Pesa payments. Admin pages send them back to Record giving, and every one of these rules is also enforced on the server.

**Staff**
Admins, treasurers and pastors don't need the Recorder role — they already have Record giving in their menu.

**Tips**
Start with one or two pilot recorders and run a Sabbath alongside the paper books before switching over.`,
};
