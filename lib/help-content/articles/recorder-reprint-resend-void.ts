import type { HelpArticle } from "../types";

export const RECORDER_REPRINT_RESEND_VOID_ARTICLE: HelpArticle = {
  slug: "recorder-reprint-resend-void",
  title: "Reprinting, resending and requesting a void",
  category: "Recording giving",
  roles: ["recorder"],
  relatedRoute: "/record",
  body: `The "Today's entries" tab on Record giving lists the receipts you issued today: receipt number, giver, time, entry type and total, plus the count and total recorded (voided receipts are left out of the total). A recorder only sees their own entries, and only for today.

**Print**
Tap Print on any entry to open the printable receipt. Pick the Print size that matches your printer — "Thermal 80mm" for a receipt roll (the default) or "A6 paper" for a small sheet — and the choice is remembered on that device. Use it for walk-in givers or anyone who wants a paper copy.

**Resend SMS**
If a giver says the SMS didn't arrive, tap Resend SMS. Each receipt can be resent up to 3 times; the button shows how many resends are left. Walk-in receipts and void receipts can't be resent.

**Request void**
If an entry is wrong — wrong amount, wrong department, recorded twice — you can't edit it. Tap "Request void", give a reason of at least 10 characters (e.g. "Recorded 5,000 instead of 500") and send it. The entry then shows "Void requested".

A treasurer or admin is notified and approves or rejects the request. If it is approved, the receipt is marked VOID: it keeps its number (numbers are never reused) but is left out of every total. Record the gift again correctly so the giver gets a new receipt.

**Limits**
- You can request a void only for receipts you issued, on the same day.
- Only one pending request per receipt.
- Once the treasurer has certified the statement for that date, voids can't be requested until an admin unlocks it.`,
};
