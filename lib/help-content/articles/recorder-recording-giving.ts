import type { HelpArticle } from "../types";

export const RECORDER_RECORDING_GIVING_ARTICLE: HelpArticle = {
  slug: "recorder-recording-giving",
  title: "Recording cash and envelope giving",
  category: "Recording giving",
  roles: ["recorder"],
  relatedRoute: "/record",
  body: `Record giving (/record) is where you enter money given in person — cash and envelopes — so every giver gets a system receipt instead of a paper one. If you hold only the Recorder role, you land here straight after logging in. Staff (admin, treasurer, pastor) can use it too, from "Record giving" in the menu.

The page has two tabs: Record, and Today's entries (with a count).

**1. Giver**
Type the giver's phone number and look it up. If the number is registered, the giver's name is shown — confirm the name with the giver before going on. If the number is not registered, a new giver record is created when you save.
For someone with no phone, switch on walk-in and type their name instead. Walk-in givers don't get an SMS receipt, so offer to print one.

**2. Departments & amounts**
Add one line per department (with a purpose where the department needs one) and its amount. The running total is shown at the bottom.

**3. Entry type**
Choose Cash (loose money / local evangelism) or Envelope (tithe & offering envelope). Your choice is remembered for the next giver.

**Date: always today**
There is no date field. Every entry is recorded for today — nobody can backdate, including admins and treasurers. Only when an admin has opened a catch-up window (for example after an internet outage) does a "Recording for" selector appear, letting you choose that past date. If you need one, ask an admin.

**4. Review & save**
Tap "Review & save" to see the confirmation sheet: giver, entry type, date, lines and total. Check them with the giver, then tap "Confirm & issue receipt".

**The receipt**
The receipt number is shown in large type, for example 20260829-0017: the date the gift was recorded, then a counter that restarts every day. You'll also see whether the SMS receipt was sent. Use Print receipt for a paper copy, or Next giver to start again.

**Poor connection?**
If saving fails because the network dropped, tap Retry. The retry is recognised as the same gift, so it is recorded only once — you'll see "Already recorded" and the original receipt number if the first attempt actually got through.

**Mistakes**
You can't edit or delete an entry. Ask for it to be voided instead — see "Reprinting, resending and requesting a void".

**If the date is locked**
If the treasurer has already certified the statement for the date, entries for it are refused until an admin unlocks it.`,
};
