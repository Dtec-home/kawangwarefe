import type { HelpArticle } from "../types";

export const ADMIN_EVENTS_ARTICLE: HelpArticle = {
  slug: "admin-events",
  title: "Managing events",
  category: "Church Content",
  roles: ["admin"],
  relatedRoute: "/admin/events",
  relatedTourKey: "admin_events_v1",
  body: `Events Management (/admin/events) is where you create and run the church events members see on the public Events page.

"New Event" asks for a title, description, date, time, and location (all required). Under "Giving (optional)" you can attach a department and purpose to make the event payable — this adds a "Give to this event" button on the public event card, and you can set a suggested amount. A "Requires registration" switch lets members RSVP in-app instead of (or as well as) an external registration link.

The stats row shows Total Events, Upcoming, Past Events, and Active counts. Search filters by title, description, or location, and you can further narrow by time (upcoming/past) or active status.

Each event card shows Active/Inactive, Upcoming/Past Event, Payable, and registration-count badges as relevant. Drag the grip handle to reorder events (there are also up/down arrow buttons as a keyboard-accessible fallback) — the new order is saved immediately. Payable events show a "Giving Summary" button with the total raised and number of contributions; events with registration show a "Registrations" button listing everyone who signed up, with an option to export the list as CSV or cancel an individual registration. The three-dot menu on each event lets you Preview, Edit, Activate/Deactivate, open the external registration link, or Delete it. Selecting several events with the checkboxes reveals bulk actions to toggle active status or delete the selection.`,
};
