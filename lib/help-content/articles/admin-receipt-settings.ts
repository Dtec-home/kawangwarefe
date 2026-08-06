import type { HelpArticle } from "../types";

export const ADMIN_RECEIPT_SETTINGS_ARTICLE: HelpArticle = {
  slug: "admin-receipt-settings",
  title: "Configuring manual receipt numbers",
  category: "Finance",
  roles: ["admin"],
  relatedRoute: "/admin/receipt-settings",
  relatedTourKey: "admin_receipt_settings_v1",
  body: `Receipt Book Settings (/admin/receipt-settings) configures the single, church-wide auto-incrementing sequence used for manual receipt numbers. Whenever staff record a manual contribution entry and leave the receipt number blank, the next number in this sequence is assigned automatically.

The page shows the next auto-assigned number at the top (combining your prefix, next number, and padding), then a form with three fields:

- Prefix — optional text shown before the number, e.g. "MB-".
- Next number — the number the very next manual receipt will use; it increments automatically after each use. Must be 0 or greater.
- Padding (digits) — zero-pads the number to this many digits (1–10), e.g. a padding of 4 turns 2000 into "2000" and 7 into "0007".

Click "Save Settings" to apply your changes — they take effect immediately for the next manual entry that's left blank. This page is restricted to full staff (admin/treasurer-level access), not department or group admins.`,
};
