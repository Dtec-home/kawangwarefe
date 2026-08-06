import type { HelpArticle } from "../types";

export const ADMIN_MEMBERS_IMPORT_ARTICLE: HelpArticle = {
  slug: "admin-members-import",
  title: "Bulk-importing members (CSV/Excel format)",
  category: "Members & Groups",
  roles: ["admin"],
  relatedRoute: "/admin/members/import",
  relatedTourKey: "admin_members_import_v1",
  body: `Import Members (Admin → Members → Import) creates or updates many members from a single CSV or Excel (.xlsx/.xls) file, up to 10MB and 5,000 data rows per file. Click "Download Template" first — it generates a CSV pre-filled with the exact column headers your church currently supports (including any department-number columns) and a few example rows.

**Required columns**
- \`first_name\`
- \`last_name\`
- \`phone_number\` — accepts 0712345678, 254712345678, or +254 712 345 678 (spaces/dashes are stripped automatically); it's normalized to 254XXXXXXXXX internally.

A row missing any of these three, or with a name over 100 characters or an unparsable phone number, is rejected with a row-numbered error — the rest of the file still imports.

**Optional columns**
- \`email\` — must contain "@" if provided.
- \`member_number\` — only applied if the member doesn't already have one, or you explicitly want to overwrite it (a blank cell never clears an existing member number).
- A group column — any one of \`group_name\`, \`group\`, \`member_group\`, \`subgroup\`, \`complex_group\`, or \`department_group\` (whichever is present is used). The member's linked login is added to that Django group by name (created if it doesn't exist).
- A group-admin flag column — any one of \`is_group_admin\`, \`group_admin\`, \`is_admin_for_group\`, or \`group_admin_flag\`. Values \`1\`, \`true\`, \`yes\`, \`y\`, or \`t\` (case-insensitive) mark the member as an admin of that row's group (added to a "<Group Name> Admins" group); anything else, or a blank cell, removes that admin status if it was previously set.
- One column per department that has "Track a per-member number" enabled (Admin → Categories → edit) — headed with that department's code, e.g. \`WELFARE\`. A value here sets that member's number for that department; a blank cell is skipped and never removes an existing number. The value must pass that department's configured format (if one is set) and can't already be assigned to a different member — either failure is reported per-row without blocking the rest of the import.

**How rows are matched**
Members are matched and upserted by phone number. An existing member's first name, last name, email, and (if provided) member number are updated; a new member is created if the phone number isn't already registered. Every imported member also gets a linked login account automatically, so they can sign in with OTP right away. Welcome SMS notifications are switched off for imports made from this page.

**Duplicates and limits**
If the same phone number appears more than once in the file, only the first occurrence is imported — later ones are reported as skipped duplicates. Files over 5,000 rows are rejected outright with a message asking you to split the file.

**After importing**
The results screen shows counts for imported, skipped (duplicates), and errors, plus how many department numbers were set, and lists every error/duplicate message with its row number so you can fix and re-upload just the affected rows.`,
};
