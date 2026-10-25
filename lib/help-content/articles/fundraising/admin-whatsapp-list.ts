import type { HelpArticle } from "../../types";

export const FUNDRAISING_WHATSAPP_LIST_ARTICLE: HelpArticle = {
  slug: "fundraising-whatsapp-list",
  title: "Sharing the contributor list to WhatsApp",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns",
  body: `You can post a campaign's contributor list to the church WhatsApp group whenever you like, for example after a Sabbath appeal. WhatsApp does not let the system post into groups by itself, so you send it with one tap from your own phone or computer.

Staff and the campaign's department admins can share the list.

**1. Open the Share list tab**
Go to Admin → Fundraising → Campaigns, open the campaign and choose the "Share list" tab. You'll see the contributor count, the total given and the exact text that will be shared.

**2. Share list to WhatsApp**
Tap "Share list to WhatsApp". WhatsApp opens with the message ready. Pick the church group and send.

**3. Very long lists: Copy text**
Some phones refuse very long WhatsApp links, and the tab warns you when the list is that long. Tap "Copy text" instead and paste the list into the group.

**What the message contains**
The campaign title, target, amount raised and percentage, the amount pledged, then every donor, numbered, with their total so far (largest first), the "as at" time, the Pay Bill number and account, and the campaign's web link. Every donor is always listed; nothing is cut.

**Who is named**
This list names every donor and their total. Share it only to the church group. By the church's decision there is no opt-out: donors are told on the campaign page and on their SMS receipt that contributors are listed by name and amount in the church WhatsApp group. If a donor objects, raise it with the church leadership. The public web pages always show totals only.

**Record of shares**
Each share is recorded with who shared it, how many donors were listed and the total, and written to the audit log. Share and Copy text are disabled until the first gift arrives.`,
};
