import type { HelpArticle } from "../types";

export const ADMIN_MESSAGING_ARTICLE: HelpArticle = {
  slug: "admin-messaging",
  title: "Sending SMS: recipient targeting and why sends can't be undone",
  category: "Communication",
  roles: ["admin"],
  relatedRoute: "/admin/messaging",
  relatedTourKey: "admin_messaging_v1",
  body: `The Messaging page sends real SMS text messages to members' phones. Every message dispatched here goes out through the same background delivery pipeline — there is no cancel, pause, or "unsend" action anywhere in the UI once you click Send. Treat clicking Send as final, the same way you would treat clicking Send on an email to a large group.

**Quick Send vs. New Campaign — two ways to pick recipients**

- **Quick Send** is a single screen for a one-off message: write the text, then add recipients by searching for registered members by name or phone number, and/or by typing/pasting phone numbers directly (one per line or comma-separated). It doesn't use or save a template — the message text is disposable. The Send button itself shows the live recipient count and stays disabled until there's at least one recipient and a non-empty message within the character limit.

- **New Campaign** is for targeting a whole group rather than hand-picking people. It's a 3-step flow — Audience → Message → Preview & Send:
  - **Audience**: you can combine filters — Department, Group, Role (Admin, Treasurer, Pastor, Dept Admin, Group Admin, Member), specific Members (search), and/or pasted external phone numbers for people not in the member system. Leaving every filter empty targets *all active members* — there's no separate "select all" toggle, an empty audience simply means everyone. Two extra toggles matter here: "Include guests" is off by default, and "Include minors" is on by default — check them if your intended audience needs to differ from that.
  - **Message**: pick a saved, active Template (created ahead of time on the Templates tab).
  - **Preview & Send**: shows the exact recipient count, a few sample rendered messages, and how many people will be skipped (typically members with no phone number on file). The Send button is disabled if the audience resolves to zero recipients — this preview is your real chance to catch a wrong audience before anything goes out.

**Recipients that never receive anything**

A member with no phone number on file (and no guardian phone number, for dependents) is automatically skipped rather than failing — you'll see that count called out both in the New Campaign preview and, per-recipient, on the campaign's results page.

**Every message is one SMS**

Each message must fit one SMS: 160 plain characters (KES 0.8 per person). The counter under the message shows how many you have used, for example "118/160". Name tokens count at their longest: {{first_name}} as 12 characters, {{last_name}} as 15 and {{full_name}} as 25, and longer names are shortened to that. Characters such as curly quotes (’ “ ”), long dashes (–), emoji and accented letters (é) are not plain SMS characters: one of them cuts the limit to 70, so the counter warns you and names the character. Type a plain ' " or - instead. A message over one SMS cannot be sent or saved.

**There's a daily send limit**

Both Quick Send and New Campaign are subject to a daily recipient cap. Scoped senders (department or group admins) have a lower cap than full staff. If a send would exceed the cap, it's rejected up front with a message telling you how many recipients you have left for the day — nothing partially sends in that case.

**After you send**

The History tab lists every past send with its sent/failed counts; click into one for a full per-recipient delivery table and to export a CSV of just the failed numbers so you can follow up manually. That page is for review only — it doesn't let you retry or cancel anything either.`,
};
