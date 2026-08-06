import type { HelpArticle } from "../types";

export const DEPARTMENT_MEMBER_IDENTIFIERS_ARTICLE: HelpArticle = {
  slug: "department-member-identifiers",
  title: "Department member identifiers (e.g. Welfare numbers)",
  category: "Giving",
  roles: ["member", "admin"],
  relatedRoute: "/contribute",
  body: `Some departments keep their own membership numbering — separate from your general church member record — and use it to identify who a payment belongs to. The classic example is a Welfare number, but any department can be configured this way.

**Which departments use this**
It's opt-in per department — most departments don't track an identifier at all. A department only asks for one if a staff admin has switched it on for that department (with its own label, e.g. "Welfare Number"). The Welfare department is set up with this on by default (label "Welfare Number"); other departments only show the field if an admin has enabled it for them.

**Where you see and enter yours**
When you're filling in the contribution form and pick a department that tracks an identifier, a field for it appears on that row. If you've given to that department before (or an admin already assigned you one), the app looks it up by your phone number and pre-fills it — you can leave it as-is or correct it. If it's genuinely new, type it in and it's saved against your member record for that department going forward, so you won't need to re-enter it on future contributions to the same department.

Some departments also validate the format you enter (for example, digits only) — if your entry doesn't match, you'll see a message telling you the expected format before you can continue.

Because the identifier is per (member, department), the same person can have a different number in different departments, and it's shown alongside the department you're giving to — not as a single, church-wide member number.

Once a payment goes through, your department number for that contribution is shown on the payment confirmation screen, and it also appears on your SMS receipt line for that department.

**Uniqueness**
Within a single department, an identifier can only belong to one member at a time — if you try to enter a number that's already assigned to someone else in that department, the contribution is blocked with a message explaining the number is already taken, so you'll need to re-check the number with the department instead.

**For admins**
Staff admins can view, set, or remove a member's identifier for any department that tracks one directly from the Members page (Admin → Members → edit a member) — useful for correcting a typo or assigning a number before someone's first contribution. The identifier also appears in the "Dept. Member #" column on the admin Contributions page for any contribution made to a department that tracks it.`,
};
