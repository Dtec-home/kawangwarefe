import type { HelpArticle } from "../types";

export const RECEIPTS_AND_SMS_NOTIFICATIONS_ARTICLE: HelpArticle = {
  slug: "receipts-and-sms-notifications",
  title: "Receipts and SMS notifications",
  category: "Giving",
  roles: ["member", "admin"],
  body: `Whenever a contribution is successfully recorded, an SMS receipt is sent to the phone number on the contribution — you don't need to ask for one.

**When it's sent**
- M-Pesa (STK push) contributions — the receipt goes out automatically once M-Pesa confirms the payment completed. It's sent in the background, so it can arrive a few seconds after you see the confirmation screen.
- Manual entries recorded by staff (cash, envelope, or manual/other) — the receipt is sent as soon as the entry is saved, as long as a phone number was recorded against the giver. Walk-in givers with no phone number on file don't receive an SMS, since there's nowhere to send it.
- Pay Bill payments — once a Pay Bill (paybill account reference) payment has been matched to a member and department, a receipt is sent the same way.
- Failed or still-pending M-Pesa payments never generate a receipt — only a completed payment does.

**What the receipt contains**
A standard single-department receipt reads roughly like:
\`\`\`
Thank you [First name]!
[Department name]: KES [amount]
Ref: [reference]
[date and time]
\`\`\`

The reference line shows the M-Pesa receipt code for M-Pesa payments, or the physical receipt book number for manual entries. If a staff admin later records a book receipt number against an M-Pesa payment too (to reconcile it with paper records), the reference line shows both, e.g. "M-Pesa: QJK3X4ABCD - Book: MB-1001".

**Multi-department or split receipts**
If you gave to multiple departments in one payment (see "How multi-department giving works"), the receipt lists each department and its amount with the combined total. If instead your payment was split by purpose within a single department (for example an auto-split fund), the receipt shows the department total with each purpose's amount indented underneath, followed by the reference and date.

**Department member number**
If the department you gave to tracks a per-member identifier (e.g. a Welfare number), it isn't printed as a separate receipt line — it's captured on the M-Pesa account reference and shown to you on the payment confirmation screen instead. See "Department member identifiers" for details.`,
};
