import type { HelpArticle } from "../types";

export const EVENTS_PAGE_ARTICLE: HelpArticle = {
  slug: "events-page",
  title: "Browsing and registering for events",
  category: "Church Content",
  roles: ["member"],
  relatedRoute: "/events",
  body: `The Events page lists church events as a grid of cards, each showing the event's date, time, and location, ordered from soonest to furthest away. There's no search or filter — it's a simple chronological list.

Some events have extra actions on their card, depending on how the event was set up:

- "Give to this event" appears on events that accept contributions. It takes you to the Contribute page with the right department, purpose, and (if the organizer set one) suggested amount already filled in for you.
- "Register" appears on events that require registration. Depending on the event, this either opens a short in-page form (name and phone number) or takes you to an external registration link in a new tab. If people have already registered, you'll see a "N registered" badge on the card.

Not every event has these buttons — plenty of events are just informational (date, time, and location only).`,
};
