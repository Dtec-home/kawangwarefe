import type { HelpArticle } from "../types";

export const GIVING_TO_MULTIPLE_DEPARTMENTS_ARTICLE: HelpArticle = {
  slug: "giving-to-multiple-departments",
  title: "Giving to Multiple Departments in One Payment",
  category: "Giving",
  roles: ["member", "admin"],
  body: `You don't need a separate M-Pesa payment for every department or purpose you want to give to — the Contribute form lets you split one payment across several of them at once.

On the "Departments & Purposes" section of the form, each row lets you choose a department, a purpose (when the department requires one), and an amount. Tap "Add another fund" to add more rows — up to 10 — for other departments or purposes. Each department/purpose combination can only appear once in the list.

As you fill in amounts, the running total at the bottom of the form updates automatically. When you tap "Review Contribution" and confirm, you'll receive a single M-Pesa prompt for that combined total — just one PIN entry on your phone, no matter how many departments you selected. Once payment completes, your receipt breaks the total down by department and purpose so you can see exactly where your money went.`,
  relatedRoute: "/contribute",
  relatedTourKey: "contribution_flow",
};
