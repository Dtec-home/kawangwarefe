import type { HelpArticle } from "../types";

export const ADMIN_MANUAL_ENTRY_ARTICLE: HelpArticle = {
  slug: "admin-manual-entry",
  title: "Recording a manual contribution",
  category: "Contributions",
  roles: ["admin"],
  relatedRoute: "/admin/contributions/manual-entry",
  relatedTourKey: "admin_manual_entry_v1",
  body: `Use Manual Contribution Entry (Admin → Contributions → Manual Entry) to record a contribution that wasn't paid through the M-Pesa till prompt — for example an envelope, cash, or another manual method.

**1. Identify the giver**
Enter a phone number and it's looked up automatically when you tab away (or click Search). If a member is found, their name, phone, and member number are shown. If the number isn't registered, a new contributor record is created for it.

For a giver with no phone number at all, switch on "Walk-in / no phone" and type their name instead. Walk-in entries don't receive an SMS receipt.

**2. Entry Type**
Choose how this contribution was received: Envelope, "Local Evangelism/Loose Money" (the display label for the "cash" entry type), or Manual Entry (a catch-all for other manual records).

**3. Departments & amounts**
Under Departments, add one or more lines — each with its own department, optional purpose, and amount (minimum KES 1.00). Use the row controls to add or remove lines; at least one department and amount is required to save.

**4. Receipt Number (optional)**
A "next auto-assigned number" hint is shown based on the church's receipt book settings. Leave the field blank to use it automatically, or type your own number to override it. (Receipt Book Settings, linked at the bottom of the page, controls the numbering scheme.)

**5. Notes (optional)**
Free-text notes about the contribution.

**Saving**
Click Save Contribution. On success you'll see a confirmation and the form resets; click Add Another to log the next contribution right away, or View All Contributions to go back to the list.

If something's missing (no giver identified, no department/amount line, or an invalid amount), an error message explains what to fix before you can save.`,
};
