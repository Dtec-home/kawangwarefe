import type { HelpArticle } from "../types";

export const TREASURER_RECEIPTS_AND_VOIDS_ARTICLE: HelpArticle = {
  slug: "treasurer-receipts-and-voids",
  title: "Receipts register, voids and void requests",
  category: "Treasury",
  roles: ["admin"],
  relatedRoute: "/admin/receipts",
  body: `Receipts (Admin → Finance → Receipts, /admin/receipts) lists every receipt the system has issued. There is one receipt per giving event — one manual or recorder entry, one M-Pesa STK payment or one Pay Bill payment — covering all its department lines. Receipts are issued automatically on every channel once the money is received; you never type or set a receipt number.

**Receipt numbers**
Numbers look like 20260829-0017: the gift's date (Nairobi time), then a counter that restarts every day. They are unique and never reused. Older gifts were numbered the same way when the system was upgraded; if a paper book number was recorded for them, it is kept as the "Old book no." on the receipt.

**Register**
Filter by date (From / To, today by default), Channel (Manual, Local Evangelism/Loose Money, Envelope, M-Pesa STK, M-Pesa Pay Bill) and Status (Issued / Void), or search by receipt number, giver name or M-Pesa code. Each row shows number, date, giver, channel, total, status and who issued it ("System" for M-Pesa and older receipts). Open a receipt to view or print it; the M-Pesa code appears on the receipt, but never on the Cash Statement.

**Print size**
The receipt page has a Print size choice: "Thermal 80mm" for the receipt-roll printer (the default) or "A6 paper" for a 105 x 148 mm sheet on the office printer. Your choice is remembered on that device, so set it once per computer or phone. Either way the printout carries only the receipt — none of the surrounding menus — and a void receipt prints a VOID watermark and a boxed VOID note.

**Voiding a receipt (treasurer and admin only)**
Receipts can't be edited or deleted. To correct a mistake, void the wrong receipt and have the gift recorded again:
1. Click the void action on the row.
2. Enter a reason of at least 10 characters (e.g. "Amount entered as 5,000 instead of 500").
3. Confirm.
The receipt keeps its number, shows as VOID, and is left out of every total, report and statement. The void, who did it and the reason are audit-logged. Pastors can view receipts but cannot void.

**Void requests**
Recorders can't void; they request a void instead. Treasurers and admins see a "Void requests" tab (with a count of pending requests, also shown next to Receipts in the menu). For each request you see the receipt, the reason and who asked. Approve to void the receipt with the requester's reason, or Reject to leave it issued; either way you can add a note. Approving cannot be undone. Use the status filter to look back at approved and rejected requests.

**Certified dates**
Once the statement for a date is certified, its receipts can't be voided (and voids can't be requested) until an admin unlocks the statement.`,
};
