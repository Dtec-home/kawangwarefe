import type { HelpArticle } from "../types";

export const RECEIPTS_AND_SMS_NOTIFICATIONS_ARTICLE: HelpArticle = {
  slug: "receipts-and-sms-notifications",
  title: "Receipts and SMS notifications",
  category: "Giving",
  roles: ["member", "admin"],
  body: `Every completed gift gets a receipt with its own receipt number, whichever way you gave — M-Pesa prompt, Pay Bill, cash or envelope. When there is a phone number on the gift, the receipt is also sent to you by SMS; you don't need to ask for one.

**The receipt number**
Receipt numbers look like 20260829-0017: the date of the gift, then a counter that restarts each day. One payment gets one receipt, even if it was split across several departments.

**When it's sent**
- M-Pesa (STK push) contributions — once M-Pesa confirms the payment completed. It's sent in the background, so it can arrive a few seconds after you see the confirmation screen.
- Pay Bill payments — once the payment has been matched to a member and department.
- Cash and envelope gifts recorded at church (by a recorder or staff) — as soon as the gift is saved. Walk-in givers with no phone number don't receive an SMS; they can ask for a printed receipt instead.
- Failed or still-pending M-Pesa payments never get a receipt — only a completed payment does.

**What the SMS contains**
It reads roughly like:
\`\`\`
Receipt: 20260829-0017
M-Pesa: QJK3X4ABCD
Tithe: KES 1,000
Combined Offering - LCB: KES 500
Total: KES 1,500
29/08/26 10:30
Thank you [First name]!
\`\`\`
The M-Pesa line appears only for M-Pesa and Pay Bill payments. There is one line per department (with the purpose, if any), so a payment split across departments or purposes shows each part and the total. Very long receipts show the first few lines and "+N more".

**Corrections**
Receipts are never edited. If a gift was recorded wrongly, the treasurer voids the receipt (it keeps its number but no longer counts) and the gift is recorded again with a new receipt.

**Department member number**
If the department you gave to tracks a per-member identifier (e.g. a Welfare number), it isn't printed as a separate receipt line — it's captured on the M-Pesa account reference and shown to you on the payment confirmation screen instead. See "Department member identifiers" for details.`,
};
