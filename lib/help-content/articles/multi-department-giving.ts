import type { HelpArticle } from "../types";

export const MULTI_DEPARTMENT_GIVING_ARTICLE: HelpArticle = {
  slug: "multi-department-giving",
  title: "How multi-department giving works",
  category: "Giving",
  roles: ["member", "admin"],
  relatedRoute: "/contribute",
  relatedTourKey: "contribution_flow",
  body: `You don't need to make a separate M-Pesa payment for every department or purpose you want to give to. The contribution form lets you split one payment across multiple departments — for example KES 500 to Tithe and KES 200 to Building Fund — and it's all collected through a single M-Pesa prompt.

**How it works**
On the contribution form, the "Departments & Purposes" section starts with one row (department + amount). Click "Add" to add another row, choose a different department (or the same department with a different purpose), and enter its amount. You can add up to 10 rows in one payment. Each department/purpose combination can only appear once — the form blocks duplicates.

Once you submit, the amounts are added together into one total, and you get a single M-Pesa STK push prompt for that combined total. You enter your M-Pesa PIN once, and the one payment settles the whole thing — there's no way to end up with some rows paid and others not, because it's one payment, not several.

**Behind the scenes**
Even though it's one payment, the app still records your giving accurately: each department/purpose you selected becomes its own contribution record for the correct amount, all linked together as one group. So your Tithe and Building Fund amounts are tracked separately in reports even though you only paid once.

**If a department needs you to pick a group**
Some departments route giving to a specific member group (e.g. a youth group or ministry) rather than a top-level fund. If a department you've added requires you to choose a group and you haven't set one, the form will prompt you to pick from the eligible groups for that department before the payment can proceed.

**Department member numbers**
If a department you've selected tracks a per-member identifier (see the "Department member identifiers" article), a field for it appears on that row — this is entered per department, since the same person can have a different number in different departments.

**Receipt**
After the combined payment completes, you receive one SMS receipt. If all the amounts went to the same department (just different purposes), the receipt shows the purpose breakdown under that department; if you gave to genuinely different departments, the receipt lists each department and its amount along with the total. See the "Receipts and SMS notifications" article for details.`,
};
